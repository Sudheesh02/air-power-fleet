# Architectural & Engineering Decision Log (`decision.md`)

This document tracks all significant architectural choices, engineering decisions, library selections, and design tradeoffs made across the **Air Power Fleet Availability & Digital Twin Platform** (`air-power-fleet`).

---

## 1. Architectural & Technology Stack Decisions

### 1.1 Backend Framework: FastAPI vs Flask / Django
* **Decision**: Adopt **FastAPI** (`backend/main.py`) running via **Uvicorn** ASGI server.
* **Why this library**:
  * **Asynchronous High Performance**: High-throughput non-blocking request handling for streaming sensor telemetry and frequent polling from command cockpit dashboards.
  * **Type Safety & Auto-Validation**: Native integration with Pydantic (`SortieEvaluationRequest`, `TriageDispatchRequest`, `WorkOrderUpdateRequest`) eliminates manual payload parsing and guarantees schema enforcement at runtime.
  * **Automated Interactive OpenAPI / Swagger Docs**: Auto-generates interactive API explorer at `/docs`, enabling immediate end-to-end testing of defense endpoints without external tools like Postman.
* **Tradeoff Accepted**:
  * *Tradeoff*: ASGI complexity compared to minimal synchronous microframeworks (e.g., Flask).
  * *Justification*: The automated schema validation, automatic docs, and speed advantages heavily outweigh the slight configuration overhead.

---

### 1.2 Frontend Framework: React 18 + Vite vs Plain HTML/JS or Next.js
* **Decision**: Adopt **React 18 with Vite build tool** (`frontend_app/`), paired with Tailwind CSS and Lucide React icons.
* **Why this library**:
  * **Instant HMR (Hot Module Replacement)**: Vite uses native ES modules in development, yielding sub-millisecond dev server reloads.
  * **Componentized State Management**: Defense tactical cockpits require synchronized updates across multiple widgets (Digital Twin 3D view, Sortie clearance status, Spares alert badges) without full-page reloads.
  * **Modular Component Architecture**: Reusable UI primitives (`GlassCard`, `StatCard`, `StatusBadge`, `TurbofanEngineSchematic`).
* **Tradeoff Accepted**:
  * *Tradeoff*: Client-side single-page application (SPA) bundle requires build step (`npm run build`).
  * *Justification*: Standalone SPA architecture decouples backend analytics engines from UI presentation, allowing either integrated hosting via FastAPI static mount (`/dashboard`) or independent edge deployment (e.g. Vercel).

---

### 1.3 Database Engine: Embedded SQLite vs PostgreSQL / MySQL
* **Decision**: Use an **Embedded SQLite database** (`data/air_power_fleet.db`) with relational multi-silo schema.
* **Why this library**:
  * **Zero External Infrastructure Dependency**: Operates out-of-the-box without requiring installation, provisioning, or network configuration of separate database services (crucial for air-gapped military deployments and one-click local launches).
  * **Single-File Portability**: Database state, telemetry snapshots, and procurement tables reside in one portable binary file (`air_power_fleet.db`), making backups, seeding, and migration trivial.
  * **Native Python `sqlite3`**: Zero additional third-party database driver dependencies.
* **Tradeoff Accepted**:
  * *Tradeoff*: SQLite locks the entire database file during writes and lacks distributed horizontal scaling.
  * *Justification*: Fleet management operations in this platform are predominantly high-frequency reads with transactional writes on triage dispatch. SQLite's write-ahead logging (WAL) and fast local I/O are more than adequate for local and forward-operating-base scales.

---

### 1.4 Prognostics Approach: Physics-Informed Digital Twin vs Pure Black-Box ML
* **Decision**: Implement a **5-Stage Gas-Path Thermodynamic Digital Twin** (`engine/digital_twin_engine.py`) combined with conformal confidence bounds.
* **Why this architecture**:
  * **Explainability in High-Stakes Defense**: Military sortie commanders cannot trust arbitrary neural network predictions without physical root-cause justification. The physics twin isolates degradation stage-by-stage:
    1. Fan Stage (Aerodynamic efficiency & bypass pressure ratio)
    2. Low-Pressure Compressor (LPC wear & pressure deviation)
    3. High-Pressure Compressor (HPC tip clearance & temperature surge)
    4. Combustor & High-Pressure Turbine (HPT thermal creep & thermal barrier breakdown)
    5. Low-Pressure Turbine (LPT efficiency & exhaust gas temp)
  * **Conformal Prediction Bounds**: Instead of a single point RUL prediction, the twin outputs a 90% conformal confidence interval (`[conservative_rul, optimistic_rul]`), enforcing mission clearance against conservative worst-case limits.
* **Tradeoff Accepted**:
  * *Tradeoff*: Requires aerodynamic & thermodynamic calibration equations and domain-specific thresholds rather than generic end-to-end neural networks.
  * *Justification*: Defense aviation requires deterministic safety margins. A conservative RUL guarantees that aircraft are never cleared for combat sorties when degradation is near threshold.

---

### 1.5 Client Network Resilience: Graceful Fallback Hybrid Pattern (`fleetApi.js`)
* **Decision**: Implement an **automatic live-backend detection with mock data fallback** in `frontend_app/src/api/fleetApi.js`.
* **Why this pattern**:
  * **AbortController Timeout (2500ms)**: Every network request is bounded. If the backend server is offline or restarting, the UI does not crash or hang in infinite loading spinners.
  * **High-Fidelity Mock Fallback**: The UI seamlessly swaps to deterministic mock defense datasets (`mockFleetData.js`) and displays a UI status indicator indicating offline/fallback mode.
  * **Dual Data Hydration**: When backend is reachable, live telemetry and digital twin health scores dynamically overwrite mock profiles.
* **Tradeoff Accepted**:
  * *Tradeoff*: Maintaining parity between mock schemas and backend response models.
  * *Justification*: Prevents front-end developer blockage, allows standalone UI demos without spinning up the Python backend, and ensures total zero-downtime resilience for command presentations.

---

## 2. Tradeoff Matrix Summary

| Area | Decision | Alternative Considered | Key Benefit | Accepted Tradeoff |
| :--- | :--- | :--- | :--- | :--- |
| **API Backend** | FastAPI + Pydantic | Flask / Django REST | High-speed async, automatic OpenAPI docs, strict type safety | Slight async syntax overhead |
| **Frontend** | React 18 + Vite | Pure Vanilla JS / Next.js | Reusable component states, instant HMR, high modularity | Requires client-side compilation |
| **Data Layer** | SQLite (`air_power_fleet.db`) | PostgreSQL / MongoDB | Zero-dependency deployment, portable single file | Database-level write lock under high concurrency |
| **Prognostics** | 5-Stage Gas Path Twin + Conformal Bounds | End-to-end Deep Learning (LSTM/Transformer) | Transparent physical interpretability for mission commanders | Higher domain modeling effort |
| **Client API** | Fallback-Aware Fetch Client (`fleetApi.js`) | Direct Axios/Fetch | Zero-crash offline robustness, immediate UI responsiveness | Needs schema sync between backend & mock data |

---

## 3. Decision Changelog (Ongoing)

Whenever modifying code in this codebase, log all new architectural choices, introduced dependencies, refactors, or design changes below:

### Entry Template:
```markdown
### [YYYY-MM-DD] - <Short Title of Decision>
- **Component Affected**: (e.g., `backend/main.py`, `engine/sortie_planner.py`, `frontend_app/...`)
- **Change Description**: What was changed or introduced.
- **Library / Method Chosen**: Name of the library or design pattern and why it was chosen.
- **Tradeoffs & Mitigations**: What tradeoff was accepted and how risks are mitigated.
```

### [2026-10-20] - Initial Repository Setup & Dual Documentation Tracking
- **Component Affected**: Root workspace (`decision.md`, `flow.md`)
- **Change Description**: Initialized project-wide decision architecture and execution flow tracing documents following local repository checkout.
- **Library / Method Chosen**: Markdown-driven documentation integrated directly into repository root for full git version control and pair-programming compliance.
- **Tradeoffs & Mitigations**: Markdown requires disciplined updates alongside code changes; mitigated by explicit changelog template and automated agent prompts.

### [2026-10-20] - Dual-Layer Repository Preservation & Development Branch Isolation
- **Component Affected**: Repository Root, Git Version Control, Filesystem
- **Change Description**: Created a dual-layer preservation strategy prior to major code changes:
  1. Complete physical filesystem snapshot clone at `C:\Users\shiv7\OneDrive\Documents\Desktop\air-power-fleet-backup`.
  2. Isolated Git branch `develop` created from untouched baseline `main`.
- **Library / Method Chosen**: Git branching model (`develop` branch) combined with out-of-tree full directory preservation.
  - *Why this method*: Allows aggressive refactoring, experimental dependency changes, or schema modifications with zero risk to the baseline codebase. Standard Git merge (`git checkout main && git merge develop`) enables clean, reviewable integration if experiments succeed.
- **Tradeoffs & Mitigations**:
  - *Tradeoff*: Physical backup consumes local disk storage (~30-50 MB).
  - *Mitigation*: The project size is relatively compact, and disk duplication provides fail-safe recovery against accidental destructive commands (`git reset --hard` or uncommitted edits).


### [2026-10-20] - Vayu-AI Tactical Voice Agent & Sarvam AI bulbul:v3 Integration
- **Component Affected**: `backend/main.py`, `frontend_app/src/services/voiceAgentService.js`, `frontend_app/src/components/common/TacticalVoiceCopilot.jsx`
- **Change Description**: Integrated Vayu-AI, a defense-oriented voice assistant and interactive cockpit copilot. The backend provides a proxy endpoint `/api/voice/synthesize` that interfaces with Sarvam AI's Indian-English speech synthesis (`bulbul:v3`, speaker `shubh`), while the frontend client implements local intent parsing and fallback to browser Web Speech API.
- **Library / Method Chosen**:
  - *Backend*: Standard library `urllib.request` + `json` to proxy requests to `https://api.sarvam.ai/text-to-speech` with `SARVAM_API_KEY`, avoiding extra heavy external HTTP client dependencies.
  - *Frontend*: Browser native `webkitSpeechRecognition` / `SpeechRecognition` for low-latency client-side speech-to-text (STT) without transmitting continuous audio to third parties; dual-mode TTS (Sarvam AI base64 audio when API key exists, fallback to browser `speechSynthesis`).
- **Tradeoffs & Mitigations**:
  - *Tradeoff*: Cloud TTS requires an external API key and Internet connectivity.
  - *Mitigation*: Graceful mock fallback: if `SARVAM_API_KEY` is not present, backend responds with `{status: "MOCK"}` and frontend seamlessly falls back to local browser speech synthesis, ensuring air-gapped usability.

### [2026-10-20] - Ingestion of Benchmark & Research Context from Alex Audit Package
- **Component Affected**: System Prognostics Pipeline & Documentation
- **Change Description**: Ingested full context from `c:\Users\shiv7\Downloads\Alex` (`AUDIT_OVERVIEW.md` and `build_notebook.py`). Aligned platform goals with Smart India Hackathon (SIH26249 / Tata Elxsi TELIPORT) standards: multi-silo fusion, C-MAPSS FD001–FD004 benchmarking, RLS streaming drift adaptation ($\lambda=0.992$), and IsolationForest false-alarm suppression ($K=3, N=5$).
- **Library / Method Chosen**: Standardized across 4 NASA turbofan subsets with operating regime clustering and physics-informed conformal bounds.
- **Tradeoffs & Mitigations**:
  - *Tradeoff*: Full deep-learning model weights (LightGBM/GRU-30) were developed as offline artifacts in research scripts.
  - *Mitigation*: Roadmap established in `AUDIT_OVERVIEW.md` to bridge ONNX runtime inference into `backend/main.py` without degrading API latency.


### [2026-10-20] - Remote Branch Upstream Publication (`origin/develop`)
- **Component Affected**: GitHub Remote Repository (`origin`), Git Tracking
- **Change Description**: Published local `develop` branch to remote GitHub repository (`git push -u origin develop`). GitHub now visibly displays both `main` and `develop` branches.
- **Library / Method Chosen**: Git upstream tracking (`--set-upstream origin develop`). Enables team collaboration, remote diff review, and Pull Request workflows (`https://github.com/Sudheesh02/air-power-fleet/pull/new/develop`).
- **Tradeoffs & Mitigations**:
  - *Tradeoff*: Remote branch is now publicly visible on GitHub.
  - *Mitigation*: Keeps production `main` branch protected while providing a transparent remote staging environment for all major experimental changes.


### [2026-10-20] - Restoration & Upstream Re-Synchronization of `develop` Branch
- **Component Affected**: Git Branching Structure, GitHub Remote Repository
- **Change Description**: Restored and re-published the `develop` branch to `origin/develop` following remote deletion. Pulled upstream `main` commit `25b1301` ("docs: add live production deployment badge and URL to README") and merged it into `develop`.
- **Library / Method Chosen**: Re-sync from `origin/main` with merge commit to guarantee zero divergence between branches.
- **Tradeoffs & Mitigations**:
  - *Tradeoff*: Requires explicit push to remote.
  - *Mitigation*: Both `develop` and `main` branches are now completely synchronized with all documentation (`decision.md`, `flow.md`) and latest commits in place.


### [2026-10-20] - Modern Charcoal & Violet UI/UX Redesign (Reference Standard)
- **Component Affected**: `frontend_app/tailwind.config.js`, `frontend_app/src/index.css`, `frontend_app/src/App.jsx`, `frontend_app/src/components/layout/Navbar.jsx`, `frontend_app/src/components/layout/Sidebar.jsx`, `frontend_app/src/components/common/StatCard.jsx`, `frontend_app/src/components/common/GlassCard.jsx`, `frontend_app/src/components/pages/CommandOverview.jsx`, `engine/sortie_planner.py`
- **Change Description**: Overhauled the presentation layer to match the provided modern analytics reference image:
  - **Color Palette Transformation**: Shifted from bright tactical navy-blue/cyan (`#060B26` / `#0075FF`) to sophisticated near-black backgrounds (`#090A0E`), charcoal surfaces (`#12131C`), crisp subtle borders (`rgba(255, 255, 255, 0.08)`), and violet/lavender accents (`#8B5CF6`, `#A78BFA`, `#C084FC`).
  - **KPI Cards**: Compact redesign with clean icons, circular `↗` action indicators, large bold stat values, subtle status badges (`+6%`, `-4%`, `+12%`), and mini cubic spline sparklines.
  - **Header & Navigation**: Restyled navbar and sidebar with sleek pill-shaped active buttons, rounded avatar badge, date/cycle picker pill, and vibrant purple action buttons.
  - **Charts & Meters**: Transformed the Predicted Fault Probability line chart with dark surfaces, subtle gridlines, and glowing lavender spline strokes; styled the Squadron Readiness Score gauge with segmented ticks and high-contrast average scores.
  - **Reference Insight Card**: Added the signature purple-indigo gradient AI insight card with sparkling indicator, dynamic text, and bottom rounded capsule step bars (`reference-insight-card`).
  - **Bug Fix**: Fixed a legacy import in `engine/sortie_planner.py` to allow fallback between local package and root execution, enabling 100% backend integration test pass rate.
- **Library / Method Chosen**: Pure CSS/Tailwind presentation overhaul reusing all existing React components, Recharts visualizations, Lucide icons, and state logic. Zero architectural or functional regressions.
- **Tradeoffs & Mitigations**:
  - *Tradeoff*: Comprehensive style transformation across multiple JSX files.
  - *Mitigation*: Validated with full `vite build` (0 warnings, 2.08s) and executed all 7 automated backend integration tests (100% pass).
