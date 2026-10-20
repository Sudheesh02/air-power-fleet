# 01 — Command Overview & KPI Shell (`CommandOverview.jsx` & `StatCard.jsx`)

**Target Files:**
- `sih_air_power_platform/frontend_app/src/components/pages/CommandOverview.jsx`
- `sih_air_power_platform/frontend_app/src/components/common/StatCard.jsx`
- `sih_air_power_platform/frontend_app/src/components/layout/Navbar.jsx`
- `sih_air_power_platform/frontend_app/src/components/layout/Sidebar.jsx`

---

## 1. Visual Diagnosis: What Currently Feels Like "AI Slop" on Command Overview

1. **Top KPI Cards (`StatCard.jsx`):**
   - Each card currently packs an icon box, a rounded pill badge with a dot, an uppercase title, a huge `font-black` value, a mini SVG sparkline, a horizontal progress bar, AND a footer line. Having both a sparkline AND a progress bar in a small card feels visually crowded.
2. **Telemetry Line Chart & Readiness Gauge Row (`CommandOverview.jsx` lines 225–390):**
   - The header of the Telemetry Line Chart has two nested pill badges (`Live Fleet Telemetry` + `50 Hz Sensor Stream`).
   - The right-hand Squadron Readiness Gauge card has a 2x2 grid of mini translucent boxes (`bg-white/5 border-white/10 rounded-xl p-2.5`) below the radial chart.
3. **Live Combat Fleet Status Matrix Table (`CommandOverview.jsx` lines 395–600):**
   - The "Inspect Twin" button in every row uses `bg-blue-600/15 text-sky-400 border border-blue-500/30 rounded-xl` which visually competes with the status badges (`MISSION READY`, `SCHEDULED`, `AOG GROUNDED`).

---

## 2. Concrete Human-Design Improvements to Apply (For Sonnet 5.5)

### Improvement A: Streamline `StatCard.jsx` into a Precision Defense Metric Tile
- **File:** `src/components/common/StatCard.jsx`
- **Action:**
  - Keep the top row clean: left side = `text-[11px] font-mono uppercase tracking-wider text-slate-400` (the metric title directly, instead of burying the title below the icon), right side = a subtle `rounded-md px-2 py-0.5 text-[10px] font-mono` delta badge.
  - Middle row: Large `text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight` value on the left, and the clean 7-point SVG sparkline (`w-20 h-9`) on the right.
  - Bottom row: Remove the redundant horizontal progress bar (since the sparkline already shows trend) and keep a single crisp `border-t border-slate-800/80 pt-2.5 mt-3 text-xs text-slate-400` context line.

### Improvement B: Clean Up Chart Headers & Flatten the Readiness Breakdown
- **File:** `src/components/pages/CommandOverview.jsx` (lines 225–390)
- **Action:**
  - **Left Chart Header:** Replace the rounded pill badge (`bg-blue-500/10 text-sky-400 rounded-full`) with a clean monospace kicker:
    ```jsx
    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
      PROPULSION TELEMETRY • 50 HZ STREAM
    </span>
    <h3 className={`text-base font-bold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      Fault Probability vs. Cumulative Flight Hours
    </h3>
    ```
  - **Right Readiness Gauge Breakdown:** Replace the 4 boxed `bg-white/5 rounded-xl` mini-cards under the radial gauge with a clean 2-column hairline table (`divide-y divide-slate-800 border-t border-slate-800 pt-3`) using `font-mono tabular-nums` for `Mission Ready`, `Standby / Scheduled`, `Grounded (AOG)`, and `MoD Target (75.0%)`.

### Improvement C: High-Contrast Tabular Alignment in the Live Fleet Table
- **File:** `src/components/pages/CommandOverview.jsx` (lines 480–595)
- **Action:**
  - Ensure all numeric columns (`Flight Hours`, `Health Index`, `Conservative RUL`) use `font-mono tabular-nums` and right-alignment (`text-right`) in both `<th>` and `<td>` so decimal points align vertically like a true flight-line status board.
  - Make the row action button ("Inspect Twin") a quiet, understated hardware button until hovered:
    ```jsx
    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
      isDark
        ? 'bg-slate-900 hover:bg-blue-700 text-slate-300 hover:text-white border-slate-800 hover:border-blue-500'
        : 'bg-white hover:bg-blue-700 text-slate-700 hover:text-white border-slate-200'
    }`}
    ```
    This immediately makes the semantic `StatusBadge` column (`MISSION READY` in emerald, `AOG GROUNDED` in red) the undisputed visual anchor of each row.

---

## 3. Strict Preservation Checklist (Do Not Break)
- Keep all 20 aircraft filterable by `selectedSquadron`, `statusFilter`, and `searchFilter`.
- Keep column sorting (`handleSort`) on `tail_no`, `aircraft_type`, `flight_hours`, `health_score`, and `rul_hours`.
- Keep clicking "Inspect Twin" wired to `setSelectedTail(ac.tail_no); setActiveTab('digital-twin');`.
