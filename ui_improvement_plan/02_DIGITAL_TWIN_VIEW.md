# 02 — Digital Twin & Gas-Path Diagnostics (`DigitalTwinView.jsx` & `TurbofanEngineSchematic.jsx`)

**Target Files:**
- `sih_air_power_platform/frontend_app/src/components/pages/DigitalTwinView.jsx`
- `sih_air_power_platform/frontend_app/src/components/common/TurbofanEngineSchematic.jsx`

---

## 1. Visual Diagnosis: What Currently Feels Like "AI Slop" on Digital Twin View

1. **Top Aircraft Selector & Summary Banner (`DigitalTwinView.jsx` lines 160–280):**
   - The top banner uses multiple pill tags (`Live Digital Twin`, `50Hz FADEC Stream`, plus status pills) and wraps three summary metric boxes inside translucent `bg-white/5 border-white/10 rounded-2xl` containers.
2. **5-Stage Gas Path Cards (`DigitalTwinView.jsx` lines 380–475):**
   - Each of the 5 thermodynamic stage cards (`Fan Intake`, `LPC`, `HPC`, `Combustor/HPT`, `LPT/Exhaust`) has a `rounded-2xl` border, an inner status pill, a progress bar, and 3 key-value telemetry lines. When placed right underneath the SVG Turbofan Cutaway, having heavy borders and bright backgrounds on all 5 cards competes with the SVG engine schematic.
3. **Subsystem Deep-Dive Cards (`DigitalTwinView.jsx` lines 530–680):**
   - The 4 subsystem cards (`Propulsion`, `Avionics`, `Hydraulics`, `Airframe`) each contain a grid of 4 inner boxed sensor tiles (`p-3 rounded-xl bg-white/5 border border-white/5`). That equals 16 nested mini-boxes on the bottom half of the screen.

---

## 2. Concrete Human-Design Improvements to Apply (For Sonnet 5.5)

### Improvement A: Turn the Top Aircraft Header into a Unified Flight-Line Specification Bar
- **File:** `src/components/pages/DigitalTwinView.jsx` (lines 160–280)
- **Action:**
  - Replace the nested `bg-white/5 rounded-2xl` summary boxes on the right side of the header (`Overall Twin Health`, `Point RUL Estimate`, `90% Conformal Lower Bound`) with a clean horizontal specification strip separated by vertical hairlines (`divide-x divide-slate-800`):
    ```jsx
    <div className={`grid grid-cols-3 divide-x rounded-lg border ${
      isDark ? 'bg-slate-950/80 border-slate-800 divide-slate-800' : 'bg-slate-50 border-slate-200 divide-slate-200'
    }`}>
      {/* Cell 1: Overall Health */}
      {/* Cell 2: Point RUL */}
      {/* Cell 3: 90% Conformal Bound + [low, high] interval */}
    </div>
    ```
  - Ensure all numbers use `font-mono tabular-nums`.

### Improvement B: Streamline the 5-Stage Gas-Path Cards Below the SVG Cutaway
- **File:** `src/components/pages/DigitalTwinView.jsx` (lines 380–475)
- **Action:**
  - Use tighter `rounded-lg p-3.5` cards with crisp `1px` borders (`border-slate-800` default, `border-blue-500 bg-blue-950/15` when selected).
  - Format the station identifier (`STN 02`, `STN 24`, `STN 30`, `STN 40`, `STN 50`) in `text-[10px] font-mono uppercase tracking-widest text-slate-400`.
  - Display the stage health percentage (`21.2%`, `88.0%`) in `text-xl font-bold font-mono tabular-nums` right-aligned next to the station name, with a thin `h-1` progress bar underneath.
  - Use a clean `divide-y divide-slate-800/60` list for the 3 station sensor readings (`T30`, `P30`, `Vibration`) with `font-mono tabular-nums`.

### Improvement C: Flatten the 16 Inner Sensor Boxes in the Subsystem Grid
- **File:** `src/components/pages/DigitalTwinView.jsx` (lines 530–680)
- **Action:**
  - Inside each subsystem `GlassCard`, replace the 2x2 grid of `bg-white/5 rounded-xl` mini-boxes with a clean 4-row engineering specification table (`divide-y divide-slate-800/80`):
    - Left: Sensor parameter name (`Exhaust Gas Temp (T50)`, `Main Oil Pressure`, `Core Vibration Index`, `Fuel Mass Flow`) in `text-xs text-slate-400`.
    - Right: Sensor reading (`848 °C`, `41.2 psi`, `4.8 ips`) in `text-xs font-mono font-semibold tabular-nums text-slate-100`.

---

## 3. Strict Preservation Checklist (Do Not Break)
- Keep the **3-Button Live Telemetry Stress & Sensor Drift Simulator** (`Nominal Baseline`, `Simulate RLS Thermocouple Drift (Gain D=1.5x)`, `Simulate Foreign Object / Sand Ingestion (HPC Surge)`) 100% functional and interactive.
- Keep `<TurbofanEngineSchematic>` synchronized with `selectedStage` and `faultSimulationMode`.
- Keep the `"Test in Sortie Simulator"` button wired to navigate to `predictive-ai`.
