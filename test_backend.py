"""
Comprehensive Integration Test for FastAPI Air Power Backend
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
try:
    from backend.main import app
except ImportError:
    from sih_air_power_platform.backend.main import app

def run_tests():
    client = TestClient(app)

    # 1. Root
    r_root = client.get("/")
    assert r_root.status_code == 200
    print("[PASS] Test 1 Passed: Root endpoint is online.")

    # 2. Fleet Readiness
    r_fleet = client.get("/api/fleet/readiness")
    assert r_fleet.status_code == 200
    data_f = r_fleet.json()
    print(f"[PASS] Test 2 Passed: Fleet Readiness -> Total: {data_f['total_aircraft']}, MC Rate: {data_f['mission_capable_rate_pct']}%, Status: {data_f['mc_status']}")

    # 3. Aircraft List (Full 20-Aircraft Combined Strategic Fleet)
    r_list = client.get("/api/fleet/aircraft")
    assert r_list.status_code == 200
    aircraft = r_list.json()["aircraft"]
    assert len(aircraft) == 20
    print(f"[PASS] Test 3 Passed: Successfully listed {len(aircraft)} military combat aircraft across operational squadrons.")

    # 4. Gas-Path Digital Twin
    r_twin = client.get("/api/aircraft/SB-021/digital-twin")
    assert r_twin.status_code == 200
    twin = r_twin.json()
    assert "stages" in twin
    print(f"[PASS] Test 4 Passed: Digital Twin for Su-30MKI (SB-021) -> Overall Health: {twin['overall_health_pct']}%, HPC: {twin['stages']['hpc']['health_pct']}%, RUL: {twin['prognostics']['conservative_rul_hours']}h")

    # 5. Sortie Feasibility Evaluation (Healthy Plane)
    r_sortie_go = client.post("/api/sortie/evaluate", json={
        "tail_no": "SB-021",
        "sortie_type": "Combat Air Patrol (CAP)",
        "duration_hours": 3.0
    })
    assert r_sortie_go.status_code == 200
    assert r_sortie_go.json()["decision"] == "MISSION_GO"
    print("[PASS] Test 5 Passed: Sortie Evaluation cleared MISSION_GO for healthy aircraft SB-021.")

    # 6. Sortie Feasibility Evaluation (Grounded Plane)
    r_sortie_nogo = client.post("/api/sortie/evaluate", json={
        "tail_no": "SB-024",
        "sortie_type": "Combat Air Patrol (CAP)",
        "duration_hours": 3.0
    })
    assert r_sortie_nogo.status_code == 200
    assert r_sortie_nogo.json()["decision"] == "NO_GO"
    print("[PASS] Test 6 Passed: Sortie Evaluation correctly rejected NO_GO for grounded aircraft SB-024.")

    # 7. Logistics & Spares Inventory
    r_inv = client.get("/api/logistics/inventory")
    assert r_inv.status_code == 200
    inv = r_inv.json()
    print(f"[PASS] Test 7 Passed: Logistics verified -> {len(inv['base_spares'])} spares items at bases, {len(inv['depot_pipeline'])} depot shipments in pipeline.")

    print("\n==================================================================")
    print("[SUCCESS] ALL 7 BACKEND INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
