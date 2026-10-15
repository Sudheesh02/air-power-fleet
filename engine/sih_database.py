"""
SIH 2026 (SIH26249) - Air Power Fleet Availability Platform
Multi-Silo Defense Relational Schema & Seeder
Unifies:
1. Aircraft Master & Fleet Allocation
2. Telemetry Snapshots (Mapped to NASA C-MAPSS Engines)
3. Technical Flight Logs & Pilot Debriefs
4. Forward Base Spares Inventory (LRUs)
5. Depot Procurement & Supply Chain Pipeline
6. Autonomous Maintenance Work Orders
"""

import sqlite3
import os
import random
from pathlib import Path
from datetime import datetime, timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = str(BASE_DIR / "data")
DB_PATH = str(BASE_DIR / "data" / "air_power_fleet.db")

def init_db(db_path=DB_PATH):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Silo 1 & Master: Aircraft Fleet
    cur.execute("""
    CREATE TABLE IF NOT EXISTS aircraft_fleet (
        tail_no TEXT PRIMARY KEY,
        aircraft_type TEXT NOT NULL,
        squadron TEXT NOT NULL,
        base_station TEXT NOT NULL,
        airframe_hours REAL NOT NULL,
        engine_serial TEXT NOT NULL,
        cmapss_unit_ref INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('MISSION_CAPABLE', 'CONDITIONAL_STANDBY', 'MAINTENANCE_GROUNDED')),
        last_inspected_cycle INTEGER NOT NULL DEFAULT 0
    )
    """)

    # Silo 1: Telemetry Snapshots
    cur.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tail_no TEXT NOT NULL,
        flight_cycle INTEGER NOT NULL,
        altitude_setting REAL,
        mach_setting REAL,
        throttle_setting REAL,
        t24_lpc_temp REAL,
        t30_hpc_temp REAL,
        t50_lpt_temp REAL,
        p30_hpc_pres REAL,
        nf_fan_speed REAL,
        nc_core_speed REAL,
        bpr_bypass_ratio REAL,
        htbleed REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(tail_no) REFERENCES aircraft_fleet(tail_no)
    )
    """)

    # Silo 2: Technical Flight Logs
    cur.execute("""
    CREATE TABLE IF NOT EXISTS flight_logs (
        log_id TEXT PRIMARY KEY,
        tail_no TEXT NOT NULL,
        mission_date TEXT NOT NULL,
        mission_type TEXT NOT NULL CHECK(mission_type IN ('Combat Air Patrol (CAP)', 'Tactical Intercept', 'Reconnaissance', 'Combat Training')),
        duration_hours REAL NOT NULL,
        pilot_callsign TEXT NOT NULL,
        g_force_peak REAL,
        pilot_remarks TEXT,
        snags_reported INTEGER DEFAULT 0,
        FOREIGN KEY(tail_no) REFERENCES aircraft_fleet(tail_no)
    )
    """)

    # Silo 3: Forward Operating Base Spares Inventory (LRUs)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS base_spares_inventory (
        item_id TEXT PRIMARY KEY,
        base_station TEXT NOT NULL,
        part_number TEXT NOT NULL,
        component_name TEXT NOT NULL,
        subsystem TEXT NOT NULL CHECK(subsystem IN ('HPC', 'LPC/Fan', 'Combustor', 'LPT', 'Fuel System', 'FADEC/Avionics')),
        quantity_on_hand INTEGER NOT NULL,
        safety_stock_threshold INTEGER NOT NULL,
        unit_cost_inr INTEGER NOT NULL,
        location_bin TEXT NOT NULL
    )
    """)

    # Silo 4: Central Depot Procurement & Transit Pipeline
    cur.execute("""
    CREATE TABLE IF NOT EXISTS depot_procurement (
        req_id TEXT PRIMARY KEY,
        tail_no TEXT NOT NULL,
        base_station TEXT NOT NULL,
        component_name TEXT NOT NULL,
        priority TEXT NOT NULL CHECK(priority IN ('CRITICAL_AOG', 'EXPEDITED_MISSION', 'ROUTINE_DEPOT')),
        status TEXT NOT NULL CHECK(status IN ('ALLOCATED', 'IN_TRANSIT', 'PENDING_APPROVAL', 'DELIVERED')),
        eta_hours INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(tail_no) REFERENCES aircraft_fleet(tail_no)
    )
    """)

    # Unified Action: Autonomous Work Orders
    cur.execute("DROP TABLE IF EXISTS work_orders")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS work_orders (
        order_id TEXT PRIMARY KEY,
        tail_no TEXT NOT NULL,
        severity_tier INTEGER NOT NULL,
        severity_label TEXT NOT NULL,
        fault_subsystem TEXT NOT NULL,
        predicted_rul REAL NOT NULL,
        lower_bound_rul REAL NOT NULL,
        action_required TEXT NOT NULL,
        spares_allocated BOOLEAN DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('DISPATCHED', 'IN_PROGRESS', 'AWAITING_SPARES', 'RESOLVED')),
        technician TEXT,
        hangar_bay TEXT,
        required_tooling TEXT,
        linked_requisition TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(tail_no) REFERENCES aircraft_fleet(tail_no)
    )
    """)

    conn.commit()
    conn.close()
    print(f"[OK] Database initialized at: {db_path}")

def seed_defence_data(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Clear existing seed to keep idempotent
    for tbl in ['work_orders', 'depot_procurement', 'base_spares_inventory', 'flight_logs', 'telemetry_snapshots', 'aircraft_fleet']:
        cur.execute(f"DELETE FROM {tbl}")

    # Seed 18 Aircraft across 3 Fighter Squadrons
    aircraft_profiles = [
        # Squadron 1: No. 222 "Tigersharks" (AFS Thanjavur) - Su-30MKI
        ("SB-021", "Su-30MKI Twin-Jet Air Superiority", "No. 222 'Tigersharks'", "AFS Thanjavur", 1420.5, "AL31FP-8812", 1, "MISSION_CAPABLE"),
        ("SB-022", "Su-30MKI Twin-Jet Air Superiority", "No. 222 'Tigersharks'", "AFS Thanjavur", 1890.2, "AL31FP-8815", 2, "MISSION_CAPABLE"),
        ("SB-023", "Su-30MKI Twin-Jet Air Superiority", "No. 222 'Tigersharks'", "AFS Thanjavur", 2150.0, "AL31FP-8819", 3, "CONDITIONAL_STANDBY"),
        ("SB-024", "Su-30MKI Twin-Jet Air Superiority", "No. 222 'Tigersharks'", "AFS Thanjavur", 2310.8, "AL31FP-8822", 4, "MAINTENANCE_GROUNDED"),
        ("SB-025", "Su-30MKI Twin-Jet Air Superiority", "No. 222 'Tigersharks'", "AFS Thanjavur", 980.4,  "AL31FP-8830", 5, "MISSION_CAPABLE"),
        ("SB-026", "Su-30MKI Twin-Jet Air Superiority", "No. 222 'Tigersharks'", "AFS Thanjavur", 1640.1, "AL31FP-8834", 6, "MISSION_CAPABLE"),

        # Squadron 2: No. 45 "Flying Daggers" (AFS Sulur) - Tejas Mk1A LCA
        ("KH-201", "Tejas Mk1A Light Combat Aircraft", "No. 45 'Flying Daggers'", "AFS Sulur", 650.0,  "F404-IN20-101", 7, "MISSION_CAPABLE"),
        ("KH-202", "Tejas Mk1A Light Combat Aircraft", "No. 45 'Flying Daggers'", "AFS Sulur", 820.5,  "F404-IN20-104", 8, "MISSION_CAPABLE"),
        ("KH-203", "Tejas Mk1A Light Combat Aircraft", "No. 45 'Flying Daggers'", "AFS Sulur", 1120.4, "F404-IN20-108", 9, "CONDITIONAL_STANDBY"),
        ("KH-204", "Tejas Mk1A Light Combat Aircraft", "No. 45 'Flying Daggers'", "AFS Sulur", 1340.2, "F404-IN20-112", 10, "MAINTENANCE_GROUNDED"),
        ("KH-205", "Tejas Mk1A Light Combat Aircraft", "No. 45 'Flying Daggers'", "AFS Sulur", 510.8,  "F404-IN20-115", 11, "MISSION_CAPABLE"),
        ("KH-206", "Tejas Mk1A Light Combat Aircraft", "No. 45 'Flying Daggers'", "AFS Sulur", 730.0,  "F404-IN20-119", 12, "MISSION_CAPABLE"),

        # Squadron 3: No. 17 "Golden Arrows" (AFS Ambala) - Rafale DH
        ("RB-001", "Rafale Omnirole Combat Fighter", "No. 17 'Golden Arrows'", "AFS Ambala", 940.6,  "M88-4E-901", 13, "MISSION_CAPABLE"),
        ("RB-002", "Rafale Omnirole Combat Fighter", "No. 17 'Golden Arrows'", "AFS Ambala", 1150.3, "M88-4E-905", 14, "MISSION_CAPABLE"),
        ("RB-003", "Rafale Omnirole Combat Fighter", "No. 17 'Golden Arrows'", "AFS Ambala", 1480.0, "M88-4E-909", 15, "CONDITIONAL_STANDBY"),
        ("RB-004", "Rafale Omnirole Combat Fighter", "No. 17 'Golden Arrows'", "AFS Ambala", 1720.5, "M88-4E-914", 16, "MAINTENANCE_GROUNDED"),
        ("RB-005", "Rafale Omnirole Combat Fighter", "No. 17 'Golden Arrows'", "AFS Ambala", 610.2,  "M88-4E-918", 17, "MISSION_CAPABLE"),
        ("RB-006", "Rafale Omnirole Combat Fighter", "No. 17 'Golden Arrows'", "AFS Ambala", 870.0,  "M88-4E-922", 18, "MISSION_CAPABLE"),

        # Squadron 4: No. 81 "Skylords" (AFS Hindan) - C-17 Globemaster III
        ("CB-8001", "C-17 Globemaster III Strategic Transport", "No. 81 'Skylords'", "AFS Hindan", 3420.0, "F117-PW-100-301", 19, "MISSION_CAPABLE"),

        # Squadron 5: No. 116 Helicopter Unit "Tankbusters" (AFS Jodhpur) - ALH Rudra / Dhruv
        ("IA-3104", "ALH Rudra / Dhruv Combat Utility", "No. 116 Helicopter Unit", "AFS Jodhpur", 1240.2, "TM333-2B2-401", 20, "MAINTENANCE_GROUNDED")
    ]

    cur.executemany("""
    INSERT INTO aircraft_fleet (tail_no, aircraft_type, squadron, base_station, airframe_hours, engine_serial, cmapss_unit_ref, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, aircraft_profiles)

    # Seed Forward Base Spares across all 3 bases
    bases = ["AFS Thanjavur", "AFS Sulur", "AFS Ambala"]
    spares_catalog = [
        ("LRU-HPC-01", "HPC Rotor Blade Stage 1-3 Set", "HPC", 4, 3, 4200000, "BIN-A12"),
        ("LRU-HPC-02", "HPC Stator Vane Assembly", "HPC", 2, 2, 2800000, "BIN-A15"),
        ("LRU-LPC-01", "Fan Rotor Blade Set (Titanium)", "LPC/Fan", 3, 2, 6500000, "BIN-B04"),
        ("LRU-LPT-01", "LPT Thermocouple Wiring Harness", "LPT", 6, 4, 350000, "BIN-C08"),
        ("LRU-FUEL-01", "Digital High-Pressure Fuel Pump", "Fuel System", 2, 2, 1850000, "BIN-D01"),
        ("LRU-FADEC-01", "Dual-Channel FADEC Electronic Engine Controller", "FADEC/Avionics", 1, 1, 9500000, "BIN-E02")
    ]

    spares_rows = []
    for b_idx, base in enumerate(bases):
        for item in spares_catalog:
            # Inject realistic regional variations and stock shortages
            qty = item[3]
            if base == "AFS Thanjavur" and item[1] == "HPC Rotor Blade Stage 1-3 Set":
                qty = 0  # Deliberate shortage at Thanjavur to trigger supply chain logic!
            elif base == "AFS Sulur" and item[1] == "Digital High-Pressure Fuel Pump":
                qty = 1  # Below safety threshold
            base_code = base.split()[1][:3].upper()
            item_id = f"{item[0]}-{base_code}"
            spares_rows.append((item_id, base, f"P/N-{random.randint(10000,99999)}", item[1], item[2], qty, item[4], item[5], item[6]))

    cur.executemany("""
    INSERT INTO base_spares_inventory (item_id, base_station, part_number, component_name, subsystem, quantity_on_hand, safety_stock_threshold, unit_cost_inr, location_bin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, spares_rows)

    # Seed Central Depot Procurement Pipeline (Unique distinct aircraft & parts, zero duplicates)
    depot_orders = [
        ("REQ-2026-091", "RB-004", "AFS Ambala", "Turbine Disk Thermal Assembly", "CRITICAL_AOG", "IN_TRANSIT", 8, "2026-10-20 07:30:00"),
        ("REQ-2026-088", "KH-204", "AFS Sulur", "Digital High-Pressure Fuel Pump", "EXPEDITED_MISSION", "ALLOCATED", 28, "2026-10-20 04:00:00"),
        ("REQ-2026-082", "SB-024", "AFS Thanjavur", "HPC Rotor Blade Stage 1-3 Set", "CRITICAL_AOG", "IN_TRANSIT", 14, "2026-10-20 02:00:00"),
        ("REQ-2026-079", "SB-023", "AFS Thanjavur", "HPC Stator Vane Assembly", "ROUTINE_DEPOT", "PENDING_APPROVAL", 48, "2026-10-19 22:00:00")
    ]
    cur.executemany("""
    INSERT INTO depot_procurement (req_id, tail_no, base_station, component_name, priority, status, eta_hours, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, depot_orders)

    # Seed Autonomous Maintenance Work Orders across all 4 Kanban Columns
    initial_work_orders = [
        ("WO-SB-024-1014-0932", "SB-024", 3, "CRITICAL_AOG", "HPC (High-Pressure Compressor)", 14.5, 11.8,
         "AOG EMERGENCY: HPC Rotor Blade Stage 1-3 out of stock at AFS Thanjavur. Automated Requisition REQ-2026-082 en route via C-130J.",
         0, "AWAITING_SPARES", "Sqn Ldr R. Sharma (Chief Tech)", "Hangar Bay 03 (Heavy Overhaul)",
         "Borescope Kit BS-40, AL-31FP Hydraulic Puller Rig", "REQ-2026-082", "2026-10-20 02:32:15"),

        ("WO-IA-3104-1019-0900", "IA-3104", 3, "CRITICAL_AOG", "Transmission / Mast", 19.4, 16.2,
         "TM333 Turboshaft vibration isolator bushing set exhausted. Fast-track requisition submitted to HAL Rotary Division.",
         0, "AWAITING_SPARES", "Sgt P. Nambiar (Rotary Lead)", "Rotary Maintenance Bay 02",
         "Main Rotor Dynamic Balancer, Bushing Press Jig", "REQ-2026-094", "2026-10-20 04:15:00"),

        ("WO-KH-204-1013-1420", "KH-204", 3, "CRITICAL_AOG", "Fuel System & Metering", 18.2, 15.0,
         "Inducted into Bay 01. Tejas Mk1A HP Fuel pump pressure fluctuations bench overhaul and filter mesh replacement in progress.",
         1, "IN_PROGRESS", "Flt Lt K. Patel (Propulsion Lead)", "Hangar Bay 01 (Engine Test Bed)",
         "Fuel Metering Bench FMB-02, High-Pressure Leak Rig", "REQ-2026-088", "2026-10-20 03:45:00"),

        ("WO-RB-004-1015-0210", "RB-004", 3, "CRITICAL_AOG", "LPT (Low-Pressure Turbine)", 22.0, 18.2,
         "M88-4E Turbine Disk thermal barrier inspection underway. Laser ultrasound scan active on turbine stage 2 blades.",
         1, "IN_PROGRESS", "Wg Cdr V. Rao (Quality Assurance)", "Hangar Bay 02 (Advanced Composites)",
         "Laser Ultrasonic Scanner LUS-88, Thermal Scope", "REQ-2026-091", "2026-10-20 07:10:00"),

        ("WO-SB-023-1014-1600", "SB-023", 2, "PREVENTIVE_ADVISORY", "HPC & Stator Vanes", 42.0, 35.8,
         "Scheduled compressor detergent water wash and RLS streaming drift filter recalibration on stations 24 & 30.",
         1, "DISPATCHED", "JWO A. Verma (Avionics Tech)", "Hangar Bay 04 (Line Maintenance)",
         "Turbine Wash Mobile Cart TWC-4, RLS Calibration Link", "REQ-2026-079", "2026-10-20 06:30:00"),

        ("WO-RB-002-1018-0830", "RB-002", 2, "PREVENTIVE_ADVISORY", "FADEC & M88 Sensor Harness", 78.5, 71.0,
         "Preventive 100-hour diagnostic dump for FADEC Channel A/B optical link synchronizer. Pre-sortie check assigned.",
         1, "DISPATCHED", "MWO S. Sengupta (Avionics Supervisor)", "Hangar Bay 02 (Avionics Test)",
         "M88 FADEC Diagnostic Bus Adapter, MIL-STD-1553 Analyzer", "LOCAL_DEPOT_ALLOCATED", "2026-10-20 05:20:00"),

        ("WO-KH-203-1012-1100", "KH-203", 2, "PREVENTIVE_ADVISORY", "FADEC / Avionics", 68.0, 62.0,
         "FADEC Channel B resistance check and firmware diagnostic dump completed. Post-overhaul ground run certified.",
         1, "RESOLVED", "Sgt M. Singh (Avionics Tech)", "Hangar Bay 01 (Cleared)",
         "FADEC Multimeter Rig, Telemetry Downlink Dongle", "RESOLVED_INTERNAL", "2026-10-19 18:00:00"),

        ("WO-SB-022-1017-1540", "SB-022", 1, "WATCHLIST", "Hydraulic Circuit A Actuator", 92.0, 84.5,
         "Hydraulic Circuit A seal pack replacement and bleed procedure completed. Pressure held nominal at 3,050 psi.",
         1, "RESOLVED", "WO D. Mukherjee (Mechanical Lead)", "Hangar Bay 05 (Line Maintenance)",
         "Hydraulic Test Bench HTB-3000, Bleed Hose Kit", "RESOLVED_INTERNAL", "2026-10-19 14:00:00")
    ]
    cur.executemany("""
    INSERT INTO work_orders (order_id, tail_no, severity_tier, severity_label, fault_subsystem, predicted_rul, lower_bound_rul, action_required, spares_allocated, status, technician, hangar_bay, required_tooling, linked_requisition, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, initial_work_orders)

    # Seed Technical Flight Logs with Authentic IAF Callsigns
    callsigns = ["Garuda-1", "Trishul-4", "Dagger-Lead", "Arrow-Lead", "Skylord-Heavy", "Rudra-Flight"]
    missions = ["Combat Air Patrol (CAP)", "Tactical Intercept", "Reconnaissance", "Combat Training"]
    log_rows = []
    base_date = datetime.now() - timedelta(days=10)

    for plane in aircraft_profiles:
        tail = plane[0]
        for day in range(1, 6):
            log_id = f"LOG-{tail}-{day:02d}"
            m_date = (base_date + timedelta(days=day*2)).strftime("%Y-%m-%d %H:%M")
            m_type = random.choice(missions)
            dur = round(random.uniform(1.8, 4.2), 1)
            call = random.choice(callsigns)
            g_force = round(random.uniform(4.2, 7.8), 1)
            
            # Grounded planes have recorded snag remarks
            if plane[7] == "MAINTENANCE_GROUNDED" and day >= 4:
                remarks = "Core vibration spike observed on afterburner engagement. High T30 thermal trend flagged by copilot."
                snags = 1
            elif plane[7] == "CONDITIONAL_STANDBY" and day >= 4:
                remarks = "Mild throttle response lag at high altitude. Post-flight oil debris check recommended."
                snags = 1
            else:
                remarks = "Standard mission profile. Systems nominal, no pilot snags recorded."
                snags = 0

            log_rows.append((log_id, tail, m_date, m_type, dur, call, g_force, remarks, snags))

    cur.executemany("""
    INSERT INTO flight_logs (log_id, tail_no, mission_date, mission_type, duration_hours, pilot_callsign, g_force_peak, pilot_remarks, snags_reported)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, log_rows)

    conn.commit()
    conn.close()
    print(f"[OK] Database seeded successfully with 18 combat aircraft, spares inventory, flight logs, and depot pipeline!")

if __name__ == "__main__":
    init_db()
    seed_defence_data()
