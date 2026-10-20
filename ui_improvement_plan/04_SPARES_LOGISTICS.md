# 04 — Spares Inventory & Depot Turnaround Pipeline (`SparesLogistics.jsx`)

**Target File:**
- `sih_air_power_platform/frontend_app/src/components/pages/SparesLogistics.jsx`

---

## 1. Visual Diagnosis: What Currently Feels Like "AI Slop" on Spares & Logistics

1. **Automated Reorder Trigger Cards (lines 286–358):**
   - Each of the 3 AI Reorder Trigger cards currently uses `border-l-4 border-l-sky-500/80` (colored left stripe), a translucent `bg-white/[0.03]` container, and an inner `bg-black/30 rounded-xl` box for `Trigger Target`, `Stock vs Safety`, and `Demand Horizon`.
2. **Depot Turnaround Tracking (TAT) Cards (lines 380–456):**
   - The 2-column grid of in-transit depot shipments uses `bg-white/5 border-white/10 rounded-2xl` and a 4-step vertical checklist with green/gray circles.
   - Line 407 still had a leftover `text-cyan-300` class on `dp.depot_source`, and line 541 in the LRU table had `text-cyan-300` on `sp.item_id`.
3. **Top 4 KPI Cards (lines 152–264):**
   - Hardcoded `text-white` on `<h3>` values inside the 4 KPI cards (`18 Assemblies`, `1 Assembly Depleted`, `3 Depot Inductions`, `18.4 Hours Avg`) does not adapt cleanly when the user switches to Light Mode (`!isDark`).

---

## 2. Concrete Human-Design Improvements to Apply (For Sonnet 5.5)

### Improvement A: Remove `border-l-4` Stripes & Flatten the AI Reorder Trigger Cards
- **File:** `src/components/pages/SparesLogistics.jsx` (lines 286–358)
- **Action:**
  - Replace the `border-l-4` + `bg-white/[0.03]` wrapper with a crisp, uniform `rounded-xl border p-4`:
    ```jsx
    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ${
      isDark
        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
        : 'bg-white border-slate-200 shadow-sm'
    }`}
    ```
  - Replace the inner `bg-black/30 rounded-xl` box with a clean 3-row hairline list (`divide-y divide-slate-800/80 border-y border-slate-800/80 py-2 my-2 text-xs`) using `font-mono tabular-nums` for stock counts and flight hours.

### Improvement B: Fix Light/Dark Mode Contrast on the Top 4 KPI Tiles
- **File:** `src/components/pages/SparesLogistics.jsx` (lines 152–264)
- **Action:**
  - Replace hardcoded `text-white` on the 4 KPI `<h3>` elements with `${isDark ? 'text-white' : 'text-slate-900'} font-mono tabular-nums`.
  - Remove the redundant `hover:translate-y-[-2px]` bounce on KPI cards so they feel grounded like military logistics hardware.

### Improvement C: Purge Remaining `text-cyan-300` & Upgrade the FOB Inventory Table
- **File:** `src/components/pages/SparesLogistics.jsx` (lines 407, 508–584)
- **Action:**
  - Change `text-cyan-300` on `dp.depot_source` (line 407) and `sp.item_id` (line 541) to `font-mono font-bold text-sky-400` (dark) / `text-blue-700` (light).
  - Right-align (`text-right font-mono tabular-nums`) the `Stock on Hand`, `Safety Margin`, and `Unit Valuation (₹ Lakh)` columns in the Forward Operating Base LRU Matrix so numbers scan effortlessly.

---

## 3. Strict Preservation Checklist (Do Not Break)
- Keep `"Approve & Fast-Track"` wired to `handleApproveTrigger(trig.trigger_id)`.
- Keep `"Dispatch Emergency Requisition"` modal and `fleetApi.createEmergencyRequisition` intact.
- Keep `sessionStorage` sync so requisitions created from `PredictiveAnalytics` appear automatically in `depotPipeline`.
