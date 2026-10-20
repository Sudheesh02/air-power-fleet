# 05 — Maintenance Work Orders Kanban & NLP Snag Fusion (`MaintenanceLogs.jsx`)

**Target File:**
- `sih_air_power_platform/frontend_app/src/components/pages/MaintenanceLogs.jsx`

---

## 1. Visual Diagnosis: What Currently Feels Like "AI Slop" on Maintenance Logs

1. **Kanban Card Sub-Box Density (lines 307–452):**
   - Each Kanban card inside the 4 columns (`Scheduled & Dispatched`, `In Progress in Hangar`, `Awaiting Depot Spares`, `QA Cleared & Resolved`) currently packs 5 distinct sub-blocks:
     1. Header row (`Tail` pill + aircraft type + severity dot)
     2. Order ID + Base station row
     3. Subsystem + Action directive paragraph
     4. Boxed RUL grid (`p-2 rounded-lg bg-slate-800/60 border`)
     5. Boxed Tooling pill + Boxed Depot Requisition pill
     6. Boxed Technician / Bay Assignment card (`p-2 rounded-lg bg-slate-800/50 border`)
     7. Footer stage + Advance button
   - Having 4 separate bordered boxes inside a narrow 260px Kanban card makes the column feel cramped and visually noisy.
2. **Multimodal NLP Pilot Snag Correlation Drawer (lines 657–811):**
   - The expandable drawer in the Flight Logs table is a killer feature for SIH judges, but currently uses 3 nested cards (`bg-slate-800/60 rounded-xl`) each containing 3 more nested cards (`bg-slate-900/90 rounded-lg border`).
3. **Sparkles Icon (`<Sparkles>`):**
   - Line 648 uses `<Sparkles className="w-3.5 h-3.5 text-sky-400" />` on the `"Inspect Multimodal Correlation"` button. The `<Sparkles>` icon is the #1 universal cliché of generic AI wrappers.

---

## 2. Concrete Human-Design Improvements to Apply (For Sonnet 5.5)

### Improvement A: Replace `<Sparkles>` with `<Cpu>` or `<Activity>`
- **File:** `src/components/pages/MaintenanceLogs.jsx` (lines 18, 648)
- **Action:**
  - Never use `<Sparkles>` in a military aerospace interface. Replace `<Sparkles className="w-3.5 h-3.5 text-sky-400" />` with `<Activity className="w-3.5 h-3.5 text-sky-400" />` or `<Cpu className="w-3.5 h-3.5 text-sky-400" />`.

### Improvement B: De-clutter Kanban Cards by Replacing Inner Boxes with Hairlines
- **File:** `src/components/pages/MaintenanceLogs.jsx` (lines 367–428)
- **Action:**
  - Keep all data fields (`Predicted RUL`, `Safe Margin`, `Required Tooling`, `Linked Requisition`, `Assigned Technician`, `Hangar Bay`), but flatten their presentation:
    - Combine `Predicted RUL` and `90% Lower Bound` into a single crisp inline monospace bar (`border-y border-slate-800 py-1.5 my-2 flex items-center justify-between text-[11px] font-mono tabular-nums`).
    - Render `Tooling` and `Depot Requisition` as clean compact metadata rows (`text-[11px] text-slate-400 flex items-center gap-1.5`) without wrapping each line in its own `border bg-slate-800/80` box.
    - Keep the Technician Assignment row clean at the bottom right above the `Advance` action bar.

### Improvement C: Flatten the 3-Column Multimodal NLP Correlation Drawer
- **File:** `src/components/pages/MaintenanceLogs.jsx` (lines 657–811)
- **Action:**
  - In the expanded `isNlpExpanded` row:
    - Keep the 3 columns (`01 // EXTRACTED DEBRIEF ENTITIES`, `02 // CORRELATED FADEC RESIDUALS`, `03 // FUSED PROGNOSTIC DIRECTIVE`).
    - Instead of wrapping every entity and sensor reading in an inner `rounded-lg border` card, use `divide-y divide-slate-800` rows inside each column so the telemetry deltas (`+42°C EGT`, `+1.8 ips Vib`) align cleanly on the right in `font-mono tabular-nums`.

---

## 3. Strict Preservation Checklist (Do Not Break)
- Keep both `kanban` and `table` view modes working.
- Keep `handleAdvanceStatus` (advancing work orders across Kanban columns) and the `Assign Maintenance Crew & Hangar Bay` modal (`handleAssignSubmit`) 100% functional.
- Keep the expandable Multimodal NLP Correlation drawer (`expandedNlpLogId`) open by default on `LOG-SB-024-05` so judges immediately see the pilot-log-to-sensor fusion.
