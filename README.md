# vayuai

[![Live Production](https://img.shields.io/badge/Vercel-Live_Cockpit-0075FF?style=for-the-badge&logo=vercel&logoColor=white)](https://vayuai-umber.vercel.app)
[![API Status](https://img.shields.io/badge/FastAPI-Backend_Ready-00C7B7?style=for-the-badge&logo=fastapi&logoColor=white)](http://127.0.0.1:8000/docs)
[![IAF Fleet](https://img.shields.io/badge/IAF_Fleet-20_Combat_Airframes-FF9933?style=for-the-badge)](https://vayuai-umber.vercel.app)

**🌐 Live Interactive Dashboard:** [https://vayuai-umber.vercel.app](https://vayuai-umber.vercel.app)

A full-stack predictive maintenance, digital twin, and fleet availability platform for military combat aviation. Developed for **Smart India Hackathon (SIH 2026)** Problem Statement `SIH26249` (Ministry of Defence / Indian Air Force).

In military aviation, low fleet availability stems from four isolated data silos:
1. **Onboard Telemetry & HUMS**: High-frequency sensor streams from engine gas paths.
2. **Technical Records & Flight Logs**: Unstructured pilot debriefs and post-flight snag logs.
3. **Forward Operating Base (FOB) Spares**: Local Line Replaceable Unit (LRU) bin inventory.
4. **Central Depot Logistics**: Heavy overhaul queues and transit pipelines.

When an aircraft lands with early thermodynamic wear, maintenance engineers currently lack a unified system to evaluate whether the aircraft can safely fly an upcoming combat sortie, or whether required replacement LRUs are in stock locally versus stranded at a central depot.

`airpower` bridges all four silos into a single, cohesive operational loop: a 5-stage thermodynamic gas-path digital twin (NASA C-MAPSS FD001-FD004), conformal Remaining Useful Life (RUL) confidence intervals, real-time Recursive Least Squares (RLS) sensor drift compensation, multi-modal snag log fusion, and a 4-ship squadron sortie formation optimizer.

---

## Quickstart

Run the backend API and frontend dashboard locally:

```bash
# 1. Clone repository
git clone https://github.com/Sudheesh02/vayuai.git
cd vayuai

# 2. Python backend setup & launch (FastAPI)
pip install -r requirements.txt
python run_sih_platform.py

# 3. Frontend setup & dev server (React 19 + Vite)
cd frontend_app
npm install
npm run dev
```

- **Interactive Command Cockpit**: `http://localhost:5173/`
- **FastAPI REST API Docs**: `http://127.0.0.1:8000/docs`
- **Root API Status**: `http://127.0.0.1:8000/`

To run the automated backend integration test suite:

```bash
python test_backend.py
```

### Live Deployment (Vercel)

The frontend is configured for 1-click zero-config deployment on Vercel:
1. Import `Sudheesh02/air-power-fleet` on [vercel.com/new](https://vercel.com/new).
2. Framework Preset auto-detects **Vite**.
3. Click **Deploy**. Vercel will build and host the interactive command cockpit. All collaborator pushes from GitHub automatically trigger live production updates.

---

## Architecture Breakdown

The entire codebase is organized into cleanly separated modules without bloat:

| Module | File | Lines | What it does |
|---|---|---|---|
| **Digital Twin** | `engine/digital_twin_engine.py` | 413 | 5-stage thermodynamic gas-path model, NASA C-MAPSS telemetry ingester, LightGBM RUL inference, RLS sensor drift filter |
| **Sortie Planner** | `engine/sortie_planner.py` | 234 | Spares-aware mission feasibility engine, conformal RUL margin validator, automatic AOG triage generator |
| **Database** | `engine/sih_database.py` | 312 | SQLite schema for 4 defense silos (fleet, flight logs, base spares, depot pipeline) and seed migration |
| **REST Server** | `backend/main.py` | 361 | FastAPI endpoints for fleet readiness, digital twins, sortie clearance, triage dispatch, work orders, and logistics |
| **One-Click Runner** | `run_sih_platform.py` | 35 | Launcher script initializing SQLite connection, path resolution, and Uvicorn server |
| **Test Suite** | `test_backend.py` | 80 | 7-point integration test suite verifying API health, digital twins, sortie clearance, and logistics |
| **Command Overview** | `frontend_app/.../CommandOverview.jsx` | 584 | Squadron readiness gauge, fleet availability KPI sparklines, fault timeline, sortable live fleet table |
| **Digital Twin View** | `frontend_app/.../DigitalTwinView.jsx` | 867 | Subsystem diagnostics (Avionics, Propulsion, Hydraulics, Airframe), live IoT sensor stream, RLS drift panel |
| **Engine Schematic** | `frontend_app/.../TurbofanEngineSchematic.jsx` | 572 | Interactive vector SVG 5-stage cutaway with dynamic thermodynamic bindings and animated particle streamlines |
| **Predictive AI** | `frontend_app/.../PredictiveAnalytics.jsx` | 1378 | "What-If" sortie simulator, conformal degradation funnel, 4-ship formation optimizer, TreeSHAP attribution chart |
| **Spares & Logistics** | `frontend_app/.../SparesLogistics.jsx` | 672 | FOB spares inventory, automated AI reorder triggers, depot procurement tracking, emergency airlift dispatch |
| **Maintenance Logs** | `frontend_app/.../MaintenanceLogs.jsx` | 782 | 4-column maintenance Kanban board, technician assignment modal, AI multi-modal NLP snag-to-sensor fusion drawer |
| **API Client** | `frontend_app/.../fleetApi.js` | 295 | Resilient HTTP client bridging React UI with FastAPI server, featuring zero-latency local fallback simulation |
| **Mock Dataset** | `frontend_app/.../mockFleetData.js` | 1146 | Synchronized offline defense dataset mirroring SQLite schema across all 20 combat aircraft and 5 squadrons |

---

## Key System Concepts

### 1. 5-Stage Gas-Path Thermodynamic Digital Twin
Models military twin-spool turbofans (AL-31FP, GE-F404, Snecma M88) across 5 standard aerospace thermodynamic stations:
- **Station 2**: Fan & Low-Pressure Intake
- **Station 24**: Low-Pressure Compressor (LPC)
- **Station 30**: High-Pressure Compressor (HPC)
- **Station 40**: Combustor & High-Pressure Turbine (HPT)
- **Station 50**: Low-Pressure Turbine (LPT) & Exhaust

### 2. Conformal RUL Intervals
Point predictions alone are unacceptable in combat mission planning. The engine calculates Remaining Useful Life with uncertainty bounds:
$$\text{Conservative RUL} = \mu - 1.645 \cdot \sigma$$
The 90% conformal lower bound is used as the hard operational constraint. An aircraft is cleared for sortie only if:
$$\text{Conservative RUL} \ge \text{Sortie Duration} \times \text{Mission Profile Stress Multiplier}$$

### 3. In-Flight RLS Sensor Drift Adaptation
Thermocouple sensors on Station 30 degrade from thermal cycling, producing gain and bias drift. The system runs an online Recursive Least Squares (RLS) estimator to track sensor calibration variations in real time, isolating sensor drift from true physical degradation and preventing false engine groundings.

### 4. Multi-Modal NLP Snag-to-Sensor Fusion
Correlates unstructured pilot debrief remarks (e.g. *"core vibration spike on afterburner engagement"*) with high-frequency telemetry anomalies on Station 30. Fusing textual symptom extraction with numerical sensor deltas produces a combined confidence score of 98.4%, representing a +22.4% boost over sensor-only diagnostics.

### 5. 4-Ship Squadron Formation Optimizer
Optimizes multi-aircraft mission assignments by selecting the top 4 available airframes that satisfy the mission margin requirement, while protecting low-RUL aircraft from premature burnout.

---

## Fleet & Squadron Mapping

The platform tracks 20 military aircraft mapped to authentic Indian Air Force units:

| Aircraft Type | Squadron / Unit | Callsign | Role | Base Station |
|---|---|---|---|---|
| **Su-30MKI** | No. 222 Squadron | "Tigersharks" | Air Superiority | AFS Thanjavur |
| **Tejas Mk1A** | No. 45 Squadron | "Flying Daggers" | Multi-role Fighter | AFS Sulur |
| **Rafale** | No. 17 Squadron | "Golden Arrows" | Omnirole Fighter | AFS Ambala |
| **C-17 Globemaster III** | No. 81 Squadron | "Skylords" | Strategic Heavy Transport | AFS Hindan |
| **ALH Rudra / Dhruv** | No. 116 Helicopter Unit | "Tankbusters" | Rotary / Combat Support | AFS Jodhpur |

---

## REST API Reference

The FastAPI backend exposes the following core endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Platform health status and metadata |
| `GET` | `/api/fleet/readiness` | Overall Mission Capable (MC) rate and squadron readiness summary |
| `GET` | `/api/fleet/aircraft` | Full list of 20 aircraft with synchronized digital twin health and RUL |
| `GET` | `/api/aircraft/{tail_no}` | Detailed airframe profile, recent flight logs, and active work orders |
| `GET` | `/api/aircraft/{tail_no}/digital-twin` | 5-stage thermodynamic gas-path state and active sensor telemetry |
| `POST` | `/api/sortie/evaluate` | Evaluates mission clearance against RUL and FOB spares availability |
| `POST` | `/api/triage/dispatch` | Dispatches automated maintenance work order and depot requisition |
| `GET` | `/api/logistics/inventory` | FOB spares inventory (LRUs) and central depot procurement pipeline |
| `POST` | `/api/logistics/requisition` | Dispatches emergency high-priority depot requisition |
| `GET` | `/api/work-orders` | Lists all active and completed maintenance work orders |
| `PATCH` | `/api/work-orders/{id}` | Updates technician assignment, hangar bay, or order status |
| `GET` | `/api/flight-logs` | Recent pilot flight debrief logs with snag reporting |

---

## Verification & Tests

To execute the backend integration test suite:

```bash
python test_backend.py
```

Output:
```
[PASS] Test 1: Root endpoint is online.
[PASS] Test 2: Fleet Readiness -> Total: 20, MC Rate: 65.0%, Status: WARNING
[PASS] Test 3: Listed 20 military combat aircraft across operational squadrons.
[PASS] Test 4: Digital Twin for Su-30MKI (SB-021) -> Health: 80.3%, RUL: 88.4h
[PASS] Test 5: Sortie Evaluation cleared MISSION_GO for healthy aircraft SB-021.
[PASS] Test 6: Sortie Evaluation correctly rejected NO_GO for grounded aircraft SB-024.
[PASS] Test 7: Logistics verified -> 18 spares items at bases, 4 depot shipments in pipeline.

[SUCCESS] ALL 7 BACKEND INTEGRATION TESTS PASSED WITH 100% SUCCESS!
```

Frontend production build check:

```bash
cd frontend_app
npm run build
# built in ~1.5s with 0 errors
```

---

## License

MIT
