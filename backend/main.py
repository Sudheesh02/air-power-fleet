"""
SIH 2026 (SIH26249) - Air Power Fleet Availability Platform
FastAPI REST API Backend
Connects:
- Multi-Silo Defense Database (SQLite)
- 5-Stage Gas-Path Thermodynamic Digital Twin
- Spares-Aware Sortie Feasibility Engine
- Autonomous Work Order & Supply Chain Requisition
"""

import sys
import os
import sqlite3
import json
import uuid
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    from engine.digital_twin_engine import GasPathDigitalTwin
    from engine.sortie_planner import SparesAwareSortiePlanner
except ImportError:
    from sih_air_power_platform.engine.digital_twin_engine import GasPathDigitalTwin
    from sih_air_power_platform.engine.sortie_planner import SparesAwareSortiePlanner

DB_PATH = str(BASE_DIR / "data" / "air_power_fleet.db")
HTML_DASHBOARD_PATH = str(BASE_DIR / "frontend" / "dashboard.html")
VITE_DIST_PATH = str(BASE_DIR / "frontend_app" / "dist")
VITE_INDEX_PATH = os.path.join(VITE_DIST_PATH, "index.html")

app = FastAPI(
    title="Air Power Fleet Availability & Digital Twin API (SIH 2026)",
    description="Ministry of Defence (SIH26249) - Unified Fleet Prognostics, Sortie Readiness & Spares-Aware Triage System",
    version="1.0.0"
)

# Enable CORS for local Vite/React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Vite static assets if production build exists
if os.path.exists(os.path.join(VITE_DIST_PATH, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(VITE_DIST_PATH, "assets")), name="assets")

digital_twin = GasPathDigitalTwin(db_path=DB_PATH)
sortie_planner = SparesAwareSortiePlanner(db_path=DB_PATH)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ----------------- Request Models -----------------
class SortieEvaluationRequest(BaseModel):
    tail_no: str
    sortie_type: str = "Combat Air Patrol (CAP)"
    duration_hours: float = 3.5

class TriageDispatchRequest(BaseModel):
    tail_no: str

class WorkOrderUpdateRequest(BaseModel):
    status: Optional[str] = None
    technician: Optional[str] = None
    hangar_bay: Optional[str] = None

class RequisitionCreateRequest(BaseModel):
    tail_no: str
    base_station: str
    component_name: str
    priority: str = "CRITICAL_AOG"
    status: str = "IN_TRANSIT"
    eta_hours: int = 12
    depot_source: Optional[str] = "Central IAF Depot (Air Express)"
    transit_mode: Optional[str] = "Dedicated Military Logistics Airlift"

# ----------------- Endpoints -----------------

@app.get("/dashboard")
@app.get("/vision-ui")
def serve_dashboard():
    """Serves the Vision UI React Air Power Command Cockpit"""
    if os.path.exists(VITE_INDEX_PATH):
        return FileResponse(VITE_INDEX_PATH)
    if os.path.exists(HTML_DASHBOARD_PATH):
        return FileResponse(HTML_DASHBOARD_PATH)
    raise HTTPException(status_code=404, detail="Dashboard UI file not found")

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "Air Power Fleet Availability & Digital Twin Platform (SIH26249)",
        "organization": "Ministry of Defence / Indian Air Force Fleet Analytics",
        "endpoints": [
            "/api/fleet/readiness",
            "/api/fleet/aircraft",
            "/api/aircraft/{tail_no}",
            "/api/aircraft/{tail_no}/digital-twin",
            "/api/sortie/evaluate",
            "/api/triage/dispatch",
            "/api/logistics/inventory",
            "/api/work-orders",
            "/docs"
        ]
    }

@app.get("/api/fleet/readiness")
def get_fleet_readiness():
    """Calculates overall squadron Mission Capable (MC) rate and readiness metrics"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT status, COUNT(*) as count FROM aircraft_fleet GROUP BY status")
    status_counts = {row["status"]: row["count"] for row in cur.fetchall()}
    
    total_aircraft = sum(status_counts.values())
    capable = status_counts.get("MISSION_CAPABLE", 0)
    standby = status_counts.get("CONDITIONAL_STANDBY", 0)
    grounded = status_counts.get("MAINTENANCE_GROUNDED", 0)
    mc_rate = round((capable / total_aircraft * 100), 1) if total_aircraft > 0 else 0.0

    # Total Airframe Hours
    cur.execute("SELECT SUM(airframe_hours) as total_hours FROM aircraft_fleet")
    total_hours = round(cur.fetchone()["total_hours"] or 0, 1)

    # Active AOG / Requisitions
    cur.execute("SELECT COUNT(*) as active_aog FROM depot_procurement WHERE status != 'DELIVERED'")
    active_aog = cur.fetchone()["active_aog"]

    # Squadrons Breakdown
    cur.execute("""
        SELECT squadron, base_station, aircraft_type,
               COUNT(*) as total,
               SUM(CASE WHEN status = 'MISSION_CAPABLE' THEN 1 ELSE 0 END) as ready
        FROM aircraft_fleet
        GROUP BY squadron, base_station, aircraft_type
    """)
    squadrons = [dict(row) for row in cur.fetchall()]

    conn.close()

    return {
        "total_aircraft": total_aircraft,
        "mission_capable_aircraft": capable,
        "conditional_standby_aircraft": standby,
        "maintenance_grounded_aircraft": grounded,
        "mission_capable_rate_pct": mc_rate,
        "target_mc_rate_pct": 75.0,
        "mc_status": "OPTIMAL" if mc_rate >= 75.0 else ("WARNING" if mc_rate >= 60.0 else "CRITICAL"),
        "total_airframe_hours": total_hours,
        "active_depot_requisitions": active_aog,
        "squadrons": squadrons
    }

@app.get("/api/fleet/aircraft")
def list_fleet_aircraft():
    """Lists all aircraft with basic status, base station, and digital twin prognostic health"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT tail_no, aircraft_type, squadron, base_station, airframe_hours, engine_serial, status
        FROM aircraft_fleet ORDER BY status DESC, tail_no ASC
    """)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()

    aircraft = []
    for r in rows:
        try:
            twin = digital_twin.evaluate_aircraft_digital_twin(r["tail_no"])
            r["health_score"] = twin["overall_health_pct"]
            r["rul_hours"] = twin["prognostics"]["predicted_rul_hours"]
            r["conservative_rul_hours"] = twin["prognostics"]["conservative_rul_hours"]
            r["next_fault"] = twin["wear_mode"]
        except Exception:
            r["health_score"] = 80.0
            r["rul_hours"] = 100.0
            r["conservative_rul_hours"] = 85.0
            r["next_fault"] = "Standard Diagnostic Review"
        aircraft.append(r)

    return {"aircraft": aircraft}

@app.get("/api/aircraft/{tail_no}")
def get_aircraft_details(tail_no: str):
    """Detailed view for a single aircraft including recent flight logs and work orders"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM aircraft_fleet WHERE tail_no = ?", (tail_no,))
    ac = cur.fetchone()
    if not ac:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Aircraft {tail_no} not found")

    cur.execute("SELECT * FROM flight_logs WHERE tail_no = ? ORDER BY mission_date DESC LIMIT 5", (tail_no,))
    logs = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT * FROM work_orders WHERE tail_no = ? ORDER BY created_at DESC LIMIT 5", (tail_no,))
    orders = [dict(row) for row in cur.fetchall()]

    conn.close()

    twin_data = digital_twin.evaluate_aircraft_digital_twin(tail_no)

    return {
        "aircraft_profile": dict(ac),
        "digital_twin": twin_data,
        "recent_flight_logs": logs,
        "active_work_orders": orders
    }

@app.get("/api/aircraft/{tail_no}/digital-twin")
def get_aircraft_digital_twin(tail_no: str):
    """Direct endpoint to fetch 5-stage thermodynamic gas-path state"""
    try:
        return digital_twin.evaluate_aircraft_digital_twin(tail_no)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/sortie/evaluate")
def evaluate_sortie(req: SortieEvaluationRequest):
    """Evaluates mission feasibility for given tail, mission type, and duration"""
    try:
        return sortie_planner.evaluate_sortie_feasibility(
            tail_no=req.tail_no,
            sortie_type=req.sortie_type,
            planned_duration_hours=req.duration_hours
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/triage/dispatch")
def dispatch_triage(req: TriageDispatchRequest):
    """Autonomous work order and spares dispatch trigger"""
    try:
        return sortie_planner.trigger_autonomous_triage_order(tail_no=req.tail_no)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/logistics/inventory")
def get_inventory():
    """Forward operating base spares stock and central depot transit pipeline"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT item_id, base_station, part_number, component_name, subsystem, quantity_on_hand, safety_stock_threshold, unit_cost_inr, location_bin
        FROM base_spares_inventory ORDER BY base_station, quantity_on_hand ASC
    """)
    spares = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT req_id, tail_no, base_station, component_name, priority, status, eta_hours, created_at
        FROM depot_procurement ORDER BY created_at DESC
    """)
    depot_pipeline = [dict(row) for row in cur.fetchall()]

    conn.close()

    return {
        "base_spares": spares,
        "depot_pipeline": depot_pipeline
    }

@app.get("/api/work-orders")
def get_work_orders():
    """Returns all system-generated maintenance work orders"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM work_orders ORDER BY created_at DESC")
    orders = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"work_orders": orders}

@app.patch("/api/work-orders/{order_id}")
def update_work_order(order_id: str, req: WorkOrderUpdateRequest):
    """Persists technician assignment or status change for a work order in SQLite"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM work_orders WHERE order_id = ?", (order_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Work order {order_id} not found.")

    updates = []
    params = []
    if req.status is not None:
        updates.append("status = ?")
        params.append(req.status)
    if req.technician is not None:
        updates.append("technician = ?")
        params.append(req.technician)
    if req.hangar_bay is not None:
        updates.append("hangar_bay = ?")
        params.append(req.hangar_bay)

    if updates:
        params.append(order_id)
        cur.execute(f"UPDATE work_orders SET {', '.join(updates)} WHERE order_id = ?", params)
        conn.commit()

    cur.execute("SELECT * FROM work_orders WHERE order_id = ?", (order_id,))
    updated = dict(cur.fetchone())
    conn.close()
    return {"status": "SUCCESS", "work_order": updated}

@app.post("/api/logistics/requisition")
def create_requisition(req: RequisitionCreateRequest):
    """Creates a new emergency depot supply requisition in SQLite"""
    conn = get_db_connection()
    cur = conn.cursor()
    req_id = f"REQ-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO depot_procurement (req_id, tail_no, base_station, component_name, priority, status, eta_hours, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (req_id, req.tail_no, req.base_station, req.component_name, req.priority, req.status, req.eta_hours, now_str))
    conn.commit()

    cur.execute("SELECT * FROM depot_procurement WHERE req_id = ?", (req_id,))
    new_req = dict(cur.fetchone())
    conn.close()
    return {"status": "SUCCESS", "requisition": new_req}

@app.get("/api/flight-logs")
def get_flight_logs(tail_no: Optional[str] = None):
    """Returns pilot flight logs and post-sortie debrief records from SQLite"""
    conn = get_db_connection()
    cur = conn.cursor()
    if tail_no:
        cur.execute("SELECT * FROM flight_logs WHERE tail_no = ? ORDER BY mission_date DESC", (tail_no,))
    else:
        cur.execute("SELECT * FROM flight_logs ORDER BY mission_date DESC")
    logs = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"flight_logs": logs}

class VoiceSynthesisRequest(BaseModel):
    text: str
    speaker: Optional[str] = "shubh"
    model: Optional[str] = "bulbul:v3"

@app.post("/api/voice/synthesize")
def synthesize_voice(req: VoiceSynthesisRequest):
    """Proxies voice synthesis via Sarvam AI bulbul:v3"""
    api_key = os.environ.get("SARVAM_API_KEY", "")
    if not api_key:
        return {"status": "MOCK", "message": "Set SARVAM_API_KEY to enable live cloud TTS", "audio_base64": None}
    
    tts_url = "https://api.sarvam.ai/text-to-speech"
    payload = json.dumps({
        "inputs": [req.text[:480]],
        "target_language_code": "en-IN",
        "speaker": req.speaker,
        "model": req.model,
        "enable_preprocessing": True
    }).encode("utf-8")
    
    http_req = urllib.request.Request(tts_url, data=payload, headers={
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(http_req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {"status": "SUCCESS", "audio_base64": data.get("audios", [None])[0]}
    except Exception as e:
        return {"status": "ERROR", "error": str(e), "audio_base64": None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
