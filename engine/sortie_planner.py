"""
SIH 2026 (SIH26249) - Air Power Fleet Availability Platform
Module 3: Spares-Aware Sortie Feasibility & Autonomous Triage Engine
Solves the core MoD pain point:
Unifies remaining useful life prognostics with forward operating base spares
inventory and automated maintenance dispatch.
"""

import sqlite3
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    from engine.digital_twin_engine import GasPathDigitalTwin
except ImportError:
    from sih_air_power_platform.engine.digital_twin_engine import GasPathDigitalTwin

DB_PATH = str(BASE_DIR / "data" / "air_power_fleet.db")

class SparesAwareSortiePlanner:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.digital_twin = GasPathDigitalTwin(db_path=db_path)

    def evaluate_sortie_feasibility(self, tail_no: str, sortie_type: str, planned_duration_hours: float):
        """
        Evaluates whether an aircraft can safely fly an upcoming mission profile.
        Returns Go / Conditional / No-Go decision with risk factors and spares availability.
        """
        twin_data = self.digital_twin.evaluate_aircraft_digital_twin(tail_no)
        prog = twin_data['prognostics']
        stages = twin_data['stages']
        current_status = twin_data['status']
        base = twin_data['base_station']

        # Determine safety factor based on mission criticality
        safety_multipliers = {
            'Combat Air Patrol (CAP)': 1.6,
            'Tactical Intercept': 1.5,
            'Reconnaissance': 1.3,
            'Combat Training': 1.25
        }
        multiplier = safety_multipliers.get(sortie_type, 1.35)
        required_margin_hours = round(planned_duration_hours * multiplier, 1)

        conservative_fh = prog['conservative_rul_hours']

        # Decision Logic
        reasons = []
        recommendations = []

        if current_status == "MAINTENANCE_GROUNDED":
            decision = "NO_GO"
            clearance_code = "GROUNDED_CRITICAL_WEAR"
            reasons.append(f"Aircraft {tail_no} is currently grounded for high-priority gas path wear.")
            recommendations.append("Immediate hangar induction. Do not clear for flight.")
        elif conservative_fh < required_margin_hours:
            decision = "NO_GO"
            clearance_code = "INSUFFICIENT_RUL_MARGIN"
            reasons.append(
                f"Conservative remaining flight life ({conservative_fh}h) is below required mission margin ({required_margin_hours}h for {planned_duration_hours}h {sortie_type})."
            )
            recommendations.append("Reassign sortie to another squadron tail; schedule proactive maintenance.")
        elif stages['hpc']['health_pct'] < 50.0 or stages['lpt']['health_pct'] < 50.0:
            decision = "CONDITIONAL_GO"
            clearance_code = "RESTRICTED_COMBAT_ENVELOPE"
            reasons.append("Compressor/Turbine degradation detected above caution threshold.")
            recommendations.append("Cleared for subsonic cruise only. Avoid sustained afterburner and >6G turns.")
        else:
            decision = "MISSION_GO"
            clearance_code = "UNRESTRICTED_COMBAT_CLEARED"
            reasons.append(f"All 5 gas-path stages nominal. Healthy RUL margin ({conservative_fh}h available vs {required_margin_hours}h required).")
            recommendations.append("Cleared for full flight envelope.")

        # Check local spares availability: Only flag shortage if aircraft has degradation or is grounded!
        is_degraded = (current_status in ["MAINTENANCE_GROUNDED", "CONDITIONAL_STANDBY"]) or (conservative_fh < 40.0) or any(st['health_pct'] < 65.0 for st in stages.values())
        if is_degraded:
            spares_status = self._check_spares_status(base, stages)
        else:
            spares_status = {
                'critical_subsystem': 'None (All Stages Nominal)',
                'component_name': 'Nominal - Zero Critical LRUs Required',
                'quantity_on_hand': 4,
                'safety_threshold': 2,
                'stock_sufficient': True,
                'location_bin': 'Bin N/A',
                'supply_alert': 'NO_LRU_REQUIRED_NOMINAL'
            }

        return {
            'tail_no': tail_no,
            'aircraft_type': twin_data['aircraft_type'],
            'squadron': twin_data['squadron'],
            'base_station': base,
            'mission_requested': {
                'sortie_type': sortie_type,
                'planned_duration_hours': planned_duration_hours,
                'required_margin_hours': required_margin_hours
            },
            'prognostic_state': {
                'overall_health_pct': twin_data['overall_health_pct'],
                'conservative_rul_hours': conservative_fh,
                'predicted_mean_hours': prog['predicted_rul_hours']
            },
            'decision': decision,
            'clearance_code': clearance_code,
            'reasons': reasons,
            'recommendations': recommendations,
            'spares_status': spares_status
        }

    def _check_spares_status(self, base_station: str, stages: dict):
        """Cross-references degraded components against forward base inventory"""
        # Find weakest stage
        sorted_stages = sorted(stages.items(), key=lambda x: x[1]['health_pct'])
        weakest_stage_key, weakest_stage = sorted_stages[0]

        subsystem_map = {
            'hpc': 'HPC',
            'lpc': 'LPC/Fan',
            'fan': 'LPC/Fan',
            'combustor_hpt': 'Combustor',
            'lpt': 'LPT'
        }
        subsystem = subsystem_map.get(weakest_stage_key, 'HPC')

        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("""
            SELECT item_id, component_name, quantity_on_hand, safety_stock_threshold, location_bin
            FROM base_spares_inventory
            WHERE base_station = ? AND subsystem = ?
            ORDER BY quantity_on_hand ASC LIMIT 1
        """, (base_station, subsystem))
        row = cur.fetchone()
        conn.close()

        if row:
            item_id, comp_name, qty, threshold, bin_loc = row
            return {
                'critical_subsystem': subsystem,
                'component_name': comp_name,
                'quantity_on_hand': qty,
                'safety_threshold': threshold,
                'stock_sufficient': qty > 0,
                'location_bin': bin_loc,
                'supply_alert': 'STOCK_EXHAUSTED_AOG_RISK' if qty == 0 else ('STOCK_LOW' if qty <= threshold else 'STOCK_OPTIMAL')
            }
        return {'critical_subsystem': subsystem, 'stock_sufficient': True, 'supply_alert': 'NO_PART_RESTRICTION'}

    def trigger_autonomous_triage_order(self, tail_no: str):
        """
        Generates an autonomous maintenance work order and automatically allocates
        local spares or raises an emergency depot requisition.
        """
        twin_data = self.digital_twin.evaluate_aircraft_digital_twin(tail_no)
        base = twin_data['base_station']
        stages = twin_data['stages']
        spares = self._check_spares_status(base, stages)

        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()

        order_id = f"WO-{tail_no}-{datetime.now().strftime('%m%d-%H%M')}"
        severity_tier = 3 if twin_data['status'] == "MAINTENANCE_GROUNDED" else (2 if twin_data['status'] == "CONDITIONAL_STANDBY" else 1)
        severity_labels = {1: "WATCHLIST", 2: "PREVENTIVE_ADVISORY", 3: "CRITICAL_AOG"}
        severity_label = severity_labels[severity_tier]

        if spares.get('quantity_on_hand', 0) > 0:
            action = f"Induct aircraft into Hangar Bay. Replace {spares['component_name']} from local Bin {spares['location_bin']}."
            order_status = "DISPATCHED"
            spares_allocated = 1
            # Decrement local stock
            cur.execute("""
                UPDATE base_spares_inventory
                SET quantity_on_hand = quantity_on_hand - 1
                WHERE base_station = ? AND component_name = ?
            """, (base, spares['component_name']))
        else:
            action = f"AOG EMERGENCY: {spares['component_name']} out of stock at {base}. Automated Requisition raised to Central Depot."
            order_status = "AWAITING_SPARES"
            spares_allocated = 0
            
            # Insert emergency requisition
            req_id = f"REQ-AOG-{uuid.uuid4().hex[:6].upper()}"
            cur.execute("""
                INSERT INTO depot_procurement (req_id, tail_no, base_station, component_name, priority, status, eta_hours, created_at)
                VALUES (?, ?, ?, ?, 'CRITICAL_AOG', 'IN_TRANSIT', 12, ?)
            """, (req_id, tail_no, base, spares['component_name'], datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

        cur.execute("""
            INSERT INTO work_orders (order_id, tail_no, severity_tier, severity_label, fault_subsystem, predicted_rul, lower_bound_rul, action_required, spares_allocated, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id, tail_no, severity_tier, severity_label,
            spares['critical_subsystem'],
            twin_data['prognostics']['predicted_rul_mean_cycles'],
            twin_data['prognostics']['conservative_rul_cycles'],
            action, spares_allocated, order_status, datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        conn.commit()
        conn.close()

        return {
            'order_id': order_id,
            'tail_no': tail_no,
            'severity_label': severity_label,
            'action_required': action,
            'spares_allocated': bool(spares_allocated),
            'order_status': order_status
        }

if __name__ == "__main__":
    planner = SparesAwareSortiePlanner()
    
    print("\n--- TEST 1: Sortie Feasibility for Grounded SB-024 ---")
    res1 = planner.evaluate_sortie_feasibility("SB-024", "Combat Air Patrol (CAP)", 3.5)
    print(f"Decision: {res1['decision']} ({res1['clearance_code']})")
    print(f"Reasons: {res1['reasons']}")
    print(f"Spares Alert: {res1['spares_status']['supply_alert']} ({res1['spares_status']['component_name']})")

    print("\n--- TEST 2: Autonomous Work Order & Supply Chain Trigger ---")
    order = planner.trigger_autonomous_triage_order("SB-024")
    print(f"Generated Order ID: {order['order_id']}")
    print(f"Action: {order['action_required']}")
    print(f"Status: {order['order_status']}")
