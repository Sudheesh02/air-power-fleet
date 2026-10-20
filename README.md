# vayu-ai

[![Live Production](https://img.shields.io/badge/Vercel-Live_Cockpit-0075FF?style=for-the-badge&logo=vercel&logoColor=white)](https://vayu-ai.vercel.app/)
[![API Status](https://img.shields.io/badge/FastAPI-Backend_Ready-00C7B7?style=for-the-badge&logo=fastapi&logoColor=white)](http://127.0.0.1:8000/docs)
[![IAF Fleet](https://img.shields.io/badge/IAF_Fleet-20_Combat_Airframes-FF9933?style=for-the-badge)](https://vayu-ai.vercel.app/)

**🌐 Live Interactive Dashboard:** [https://vayu-ai.vercel.app/](https://vayu-ai.vercel.app/)

A full-stack predictive maintenance, digital twin, and fleet availability platform for military combat aviation. Developed for **Smart India Hackathon (SIH 2026)** Problem Statement `SIH26249` (Ministry of Defence / Indian Air Force).

In military aviation, low fleet availability stems from four isolated data silos:
1. **Onboard Telemetry & HUMS**: High-frequency sensor streams from engine gas paths.
2. **Technical Records & Flight Logs**: Unstructured pilot debriefs and post-flight snag logs.
3. **Forward Operating Base (FOB) Spares**: Local Line Replaceable Unit (LRU) bin inventory.
4. **Central Depot Logistics**: Heavy overhaul queues and transit pipelines.

When an aircraft lands with early thermodynamic wear, maintenance engineers currently lack a unified system to evaluate whether the aircraft can safely fly an upcoming combat sortie, or whether required replacement LRUs are in stock locally versus stranded at a central depot.

`vayu-ai` bridges all four silos into a single, cohesive operational loop: a 5-stage thermodynamic gas-path digital twin (NASA C-MAPSS FD001-FD004), conformal Remaining Useful Life (RUL) confidence intervals, real-time Recursive Least Squares (RLS) sensor drift compensation, multi-modal snag log fusion, and a 4-ship squadron sortie formation optimizer.

---

## Quickstart

Run the backend API and frontend dashboard locally:

```bash
# 1. Clone repository
git clone https://github.com/Sudheesh02/vayu-ai.git
cd vayu-ai

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
1. Import `Sudheesh02/vayu-ai` on [vercel.com/new](https://vercel.com/new).
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
| `GET` | `/api/mlops/retrain-status` | Returns Champion vs. Challenger RLS promotion gate metrics, D1→F1 feature pipeline, and 7-step agent loop |
| `POST` | `/api/mlops/retrain-evaluate` | Evaluates Champion vs. Challenger RLS promotion gate under stationary or 1.5× sensor drift regimes |

---

## Audited C-MAPSS Benchmarks, MLOps Promotion Gate & D1→F1 Pipeline (`poc/`)

In addition to the full-stack command cockpit, the `poc/` directory contains the standalone, reproducible NASA C-MAPSS (FD001–FD004) benchmark harness, MLflow registry, and Recursive Least Squares (RLS) retraining check.

### 1. Data-to-Feature Engineering Traceability (`D1 → F1` to `D6 → F6`)
Every preprocessing step in `poc/model.py` maps directly to a measured property of the C-MAPSS dataset (illustrated on FD002 Engine 9, sensor `s11` HPC static pressure):

| Step | Measured Property in C-MAPSS | Feature Transformation (`poc/model.py`) |
|---|---|---|
| **D1 → F1 (Step 1)** | 6 operating conditions drive **99.5%** of raw `s11` variance ($\|\rho\| = 0.08$ with RUL). | Per-condition Z-score normalization using training mean/SD; lifts $\|\rho\|$ to **0.37** (FD002) and **0.33** (FD004). |
| **D4 → F4 (Step 2)** | 6 sensors in FD001 and 5 in FD003 have zero variance; pairs `s9/s14`, `s7/s12`, `s8/s13` have $\|r\| > 0.95$. | Drop constant sensors per subset and encode physical speed/pressure differentials (`s9-s14`, `s8-s13`, `s11-s4`, `s12-s7`). |
| **D2 → F2 (Step 3)** | Normalized sensor trajectories retain cycle-to-cycle noise SD of **0.38**. | Causal **10-cycle rolling mean** inside each engine reduces noise SD to **0.16** (-58%). |
| **D6 → F6 (Step 4)** | Healthy engines start **0.3–0.5 SD** apart; 6 FD002 and 11 FD004 test engines have $<30$ cycles. | Subtract each engine's **first-20-cycle baseline mean** and left-pad short sequences to 30 cycles. |
| **D3 → F3 (Step 5)** | Wear appears at 47–55% life (39–49% of rows have RUL $>125$); final 50 cycles drift **2.9×** faster. | Clip training target RUL at **125** and compute **30-cycle** trailing mean, std, min, max, and linear slopes. |
| **D5 → F5 (Step 6)** | FD003 (mean life 305 vs 202) and FD004 (294 vs 213) mix HPC and Fan fault modes. | Project normalized sensors onto top **3 training PCA axes** so tree models separate both fault trajectories. |

### 2. Official C-MAPSS Scorecard (`poc/scorecard.json`)
Primary scores are computed at the last recorded cycle of each test engine against the **uncapped** true RUL in `RUL_FD00x.txt`, alongside secondary capped-truth ($\le 125$) scores:

| Subset | Test Engines | Gate Policy (`SUBMIT_GATE`) | Submission RMSE (Uncapped) | Submission NASA | Capped-Truth RMSE ($\le 125$) | RMSE With Gate | RMSE Without Gate | Critical Engines Caught (True RUL $\le 15$) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **FD001** | 100 | **Off** | **12.79** | **217.38** | **11.22** | 13.31 | 12.79 | **10 / 10 (100%)** |
| **FD002** | 259 | **On** ($\tau=100, \alpha=0.5$) | **20.44** | **2410.58** | **11.26** | 20.44 | 23.44 | **46 / 46 (100%)** |
| **FD003** | 100 | **Off** | **11.55** | **208.45** | **9.56** | 12.35 | 11.55 | **10 / 10 (100%)** |
| **FD004** | 248 | **On** ($\tau=105, \alpha=0.5$) | **19.84** | **2287.00** | **11.00** | 19.84 | 23.91 | **36 / 36 (100%)** |

### 3. Closed-Loop Model Retraining & Promotion Gate (`poc/rls_demo.py`)
To prevent blind weight updates on streaming aircraft telemetry, the platform evaluates an online Recursive Least Squares (RLS) challenger against the frozen champion on a held-out slice of FD001 training engines (Units 81–100, $\text{RUL} \le 125$, contest test labels untouched):
- **Stationary Holdout (No Drift):** Frozen champion RMSE is `0.234` *(a last-cycle failure snapshot on training engines where true RUL = 0, not a contest test score)* vs. RLS forgetting ($\lambda = 0.999862$) RMSE of `4.747` $\to$ **Promotion Gate REJECTS challenger (`promote_forgetting: false`)**.
- **Sensor Gain Drift Holdout (1.5× Gain Ramp):** Frozen champion degrades to `3.793` RMSE while RLS with forgetting adapts to **`2.816` RMSE (-25.8% error)** $\to$ **Promotion Gate PROMOTES challenger (`promote_forgetting: true`)** and advances the MLflow `champion` alias.

### 4. 7-Step Self-Improving Triage Agent (`poc/agent.py`)
1. **Act:** Evaluates conservative RUL ($\mu - \sigma$, clipped 0–125) across deterministic tiers (`Critical <= 15`, `High <= 40`, `Medium <= 80`) with 2-cycle escalation (`min(prev_raw, raw)`) and 5-cycle de-escalation hysteresis.
2. **Log Outcome:** Line technicians close work orders with verified findings (`fault_found`, `no_fault`, `failure_missed`).
3. **Score:** Weekly evaluation job logs false-alarm rate, missed critical failures (`0/102`), and lead time (`59–79 cycles`) to MLflow.
4. **Propose:** Generates candidate threshold adjustments in a versioned JSON rule file.
5. **Replay Test:** Replays candidate rules over historical trajectories; passes only if missed failures do not increase and false alarms drop.
6. **Human Approve:** Mandatory Engineering Officer sign-off when ensemble spread $\sigma > P_{90}$ or before releasing new rules.
7. **Release:** Updates the MLflow `champion` rule alias with 1-step rollback.

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
