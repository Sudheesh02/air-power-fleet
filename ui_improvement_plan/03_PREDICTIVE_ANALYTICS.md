# 03 — Predictive AI, Formation Optimizer & C-MAPSS Scorecard (`PredictiveAnalytics.jsx`)

**Target File:**
- `sih_air_power_platform/frontend_app/src/components/pages/PredictiveAnalytics.jsx`

---

## 1. Visual Diagnosis: What Currently Feels Like "AI Slop" on Predictive Analytics

1. **High Section Density with Repetitive Header Badges:**
   - `PredictiveAnalytics.jsx` is the most feature-rich page in the app (Single-Aircraft Sortie Go/No-Go Simulator, Multi-Aircraft 2/4/6-Ship Formation Optimizer, Conformal RUL Fan Chart, SHAP Feature Attribution Bar Chart, Fleet RUL Risk Matrix, and the NASA C-MAPSS FD001–FD004 + RLS Drift Scorecard).
   - Because almost every section header uses a similar pill badge + icon box + bold title + subtitle + right-side badge, the page can feel visually repetitive when scrolling.
2. **Nested Boxes Inside the Sortie Clearance Verdict Panel (lines 380–520):**
   - The right-hand Clearance Verdict panel contains multiple nested sub-cards for `Point RUL`, `Conservative RUL`, `Required Buffer`, `Spares Readiness`, and `NLP Snag Corroboration`.
3. **Squadron Formation Optimizer Cards (lines 530–680):**
   - Each aircraft card in the formation grid has multiple pills (`ACTIVE FLIGHT #1`, `MISSION READY`, `GO CLEARED`) plus 3 inner metric rows.

---

## 2. Concrete Human-Design Improvements to Apply (For Sonnet 5.5)

### Improvement A: Introduce Numbered Tactical Section Headers (`01 //`, `02 //`, `03 //`)
- **File:** `src/components/pages/PredictiveAnalytics.jsx`
- **Action:**
  - Replace the decorative rounded pill badges above each major section with numbered defense specification kickers:
    - `01 // MISSION CLEARANCE & FORMATION SIMULATOR`
    - `02 // SPLIT CONFORMAL RUL TRAJECTORY (90% COVERAGE)`
    - `03 // SHAP SENSOR ATTRIBUTION & THERMODYNAMIC DRIVERS`
    - `04 // FLEET-WIDE RUL RISK MATRIX`
    - `05 // VALIDATED NASA C-MAPSS (FD001–FD004) & ONLINE RLS BENCHMARK`
  - Using `text-[10px] font-mono font-semibold uppercase tracking-widest text-blue-400` for these numbered kickers creates an immediate, unmistakable human-designed engineering hierarchy.

### Improvement B: Convert the Sortie Go/No-Go Verdict Card into a Flight Clearance Ticket
- **File:** `src/components/pages/PredictiveAnalytics.jsx` (lines 380–520)
- **Action:**
  - Style the right-side Clearance Verdict panel like an authentic military Flight Release Form:
    - Top banner: Solid status bar (`border-b border-slate-800 pb-3`) with large `GO — CLEARED FOR SORTIE` (`text-emerald-400`) or `NO-GO — STRICT HANGAR HOLD` (`text-red-400`) and a single `font-mono` mathematical gate equation: `Cons. RUL (16.4h) < Required (4.2h × 1.4 = 5.9h)`.
    - Middle section: A clean 4-row hairline table (`divide-y divide-slate-800`) instead of 4 separate nested boxes for:
      1. `Point Estimate (μ)` vs `90% Conformal Lower Bound`
      2. `Effective Stress Burn` (`Duration × Profile Factor`)
      3. `Forward Base Spares Stock` (`0 units on hand` / `Allocated`)
      4. `Pilot Debrief NLP Corroboration` (`98.4% multimodal confidence`)

### Improvement C: Clean Up the NASA C-MAPSS & Online RLS Benchmark Table (Section 6)
- **File:** `src/components/pages/PredictiveAnalytics.jsx` (lines 840–970)
- **Action:**
  - Keep all verified metrics (`FD001: 12.79`, `FD002: 20.44`, `FD003: 11.55`, `FD004: 19.84`, `100% Critical Catch: 10/10, 46/46, 10/10, 36/36`, `RLS λ=0.992: 3.79 -> 2.82 RMSE (-25.6%)`).
  - Format the FD001–FD004 benchmark comparison as a crisp, dense data table (`divide-y divide-slate-800 font-mono tabular-nums`) alongside the 3-step RLS Drift comparison bars (`Static Baseline 3.79`, `Batch Retrain 3.41`, `Online RLS 2.82`).

---

## 3. Strict Preservation Checklist (Do Not Break)
- Keep the toggle between `Single-Aircraft Sortie Check` and `Squadron Formation Optimizer (2 / 4 / 6-Ship)`.
- Keep the `"Dispatch Autonomous AOG Triage Order"` button wired to `fleetApi.dispatchTriage(selectedTail)` so cross-tab persistence to `MaintenanceLogs` and `SparesLogistics` continues working.
- Keep all Recharts (`AreaChart` for Conformal RUL fan, `BarChart` for SHAP attribution) intact.
