# 06 — Tactical Voice Comms & Flight-Line Intelligence (`TacticalCopilotView.jsx` & `TacticalVoiceCopilot.jsx`)

**Target Files:**
- `sih_air_power_platform/frontend_app/src/components/pages/TacticalCopilotView.jsx` (Full-Page Terminal)
- `sih_air_power_platform/frontend_app/src/components/common/TacticalVoiceCopilot.jsx` (Floating Comms Drawer)
- `sih_air_power_platform/frontend_app/src/services/voiceAgentService.js` (Sarvam `bulbul:v3` TTS + Speech Recognition + Flight-Line Brain)

---

## 1. Completed Upgrades Applied in This Session

We have already refactored all three files above so that the Voice Agent and Chatbot work reliably and look like a true military C2 comms terminal:

1. **Purged All Neon Cyan & Toy "AI Orb" Gimmicks:**
   - Removed the self-referential `"Live Voice (Gemini Style)"` toggle label and replaced it with **`Briefing Log`** vs **`Acoustic PTT Console`**.
   - Removed the 420px `border-cyan-500/20 animate-ping` radar rings and `animate-bounce` microphone icons.
   - Replaced all `text-cyan-300`, `bg-cyan-500`, and `from-blue-950/40 to-cyan-950/40` gradients with solid matte `bg-slate-900`, `bg-slate-950`, `border-slate-800`, and `bg-blue-700` tactical controls.

2. **Fixed Speech Recognition Stale Closure & Interim Transcript Dropping (`voiceAgentService.js`):**
   - Previously, `createSpeechRecognizer` was initialized once on mount with a stale `handleSendMessage` closure, and if the browser ended speech recognition before flipping `isFinal = true`, spoken queries were silently lost.
   - Now, `createSpeechRecognizer` tracks `lastTranscript` and automatically flushes accumulated speech on `recognition.onend` if `isFinal` hasn't fired yet, while `handleSendRef` guarantees the latest state is always used.

3. **Added Full 20-Aircraft, C-MAPSS (`FD001–FD004`), and Online RLS (`λ = 0.992`) Intelligence:**
   - `queryVayuBrain` now responds accurately with exact per-tail numbers for all 3 grounded airframes (`SB-024` at AFS Thanjavur with `21.2%` HPC & `16.4h` Cons. RUL; `KH-204` at AFS Sulur with `28.0%` LPC & `19.5h` Cons. RUL; `RB-004` at AFS Ambala with `24.0%` LPT & `17.8h` Cons. RUL), the 2/4/6-ship Squadron Formation Optimizer, and the NASA C-MAPSS + Online RLS drift benchmarks.

4. **Added Grounded Airframe Live Watchlist Sidebar (`TacticalCopilotView.jsx`):**
   - The right-hand 4-column sidebar on the Voice Comms page now includes a live **AOG Hangar Watchlist** (`SB-024`, `KH-204`, `RB-004`) with one-click **"Inspect"** buttons alongside the 6 Standard Flight-Line Briefing dispatches.

---

## 2. Optional Further Polish (If Iterating with Claude Sonnet 5.5)

If you want Claude Sonnet 5.5 to take `TacticalCopilotView.jsx` even further:
- **Keyboard Shortcut (`Spacebar` Push-to-Talk in Acoustic Mode):** Bind holding down `[Space]` when `mode === 'voice'` (and input is not focused) to trigger `toggleListening()` so a presenter on stage can hold the spacebar like a cockpit radio PTT switch during the live SIH demo.
- **Cross-Tab Navigation Links Inside Chat Responses:** Add a small action button inside assistant messages (e.g., `"Open SB-024 in Digital Twin →"`) that calls `setSelectedTail('SB-024'); setActiveTab('digital-twin');` from `useTheme()`.
