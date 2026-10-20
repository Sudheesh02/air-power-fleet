// IAF Tactical Flight Line Intelligence & Voice Engine
// Powered by Sarvam AI (bulbul:v3) + Tactical Aerospace Operations Core

const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
const DEFAULT_SPEAKER = 'shubh';
const DEFAULT_SARVAM_KEY = 'REDACTED_SARVAM_KEY';

// Memory audio cache to ensure instant playback without redundant network roundtrips
const audioCache = new Map();

export const VOICE_SPEAKERS = [
  { id: 'shubh', name: 'Wg Cdr Shubh', role: 'Flight Line Operations Control', callsign: 'VAYU-OPS-1' },
  { id: 'anushka', name: 'Sqn Ldr Anushka', role: 'Propulsion & Telemetry Lead', callsign: 'VAYU-TEL-2' },
  { id: 'aditya', name: 'Flt Lt Aditya', role: 'Chief Engineering Officer (Hangar)', callsign: 'VAYU-ENG-3' },
  { id: 'ratan', name: 'Gp Capt Ratan', role: 'Strategic Command Briefing', callsign: 'VAYU-CMD-4' },
];

/**
 * Phonetically translates military aerospace telemetry, formulas, and acronyms into natural Indian English
 */
export function prepareSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/\$T_\{?30\}?\$/g, 'T thirty compressor temperature')
    .replace(/\$P_\{?30\}?\$/g, 'P thirty high pressure')
    .replace(/\$T_\{?24\}?\$/g, 'T twenty four LPC temperature')
    .replace(/\$P_\{?24\}?\$/g, 'P twenty four LPC pressure')
    .replace(/\$T_\{?50\}?\$/g, 'exhaust gas temperature')
    .replace(/\\text\{EGT\}/gi, 'exhaust gas temperature')
    .replace(/\bEGT\b/g, 'exhaust gas temperature')
    .replace(/\bHPC\b/g, 'high pressure compressor')
    .replace(/\bLPC\b/g, 'low pressure compressor')
    .replace(/\bHPT\b/g, 'high pressure turbine')
    .replace(/\bLPT\b/g, 'low pressure turbine')
    .replace(/\\mu/g, 'mean')
    .replace(/\\sigma/g, 'sigma')
    .replace(/\\ge/g, 'greater than or equal to')
    .replace(/\\le/g, 'less than or equal to')
    .replace(/\$\$\\text\{Conservative RUL\}[^$]+\$\$/g, 'Conservative R U L equals mean R U L minus one point six four five sigma')
    .replace(/\$[^$]+\$/g, '') // strip remaining raw LaTeX math delimiters
    .replace(/[#*`_~\\\[\]()|]/g, ' ') // strip markdown characters
    .replace(/\bAOG\b/g, 'aircraft on ground')
    .replace(/\bFOB\b/g, 'forward operating base')
    .replace(/\bBRD\b/g, 'base repair depot')
    .replace(/\bLRU\b/g, 'line replaceable unit')
    .replace(/\bRLS\b/g, 'recursive least squares')
    .replace(/\bQRA\b/g, 'quick reaction alert')
    .replace(/C-MAPSS/gi, 'C MAPS')
    .replace(/FD001/gi, 'F D zero zero one')
    .replace(/FD002/gi, 'F D zero zero two')
    .replace(/FD003/gi, 'F D zero zero three')
    .replace(/FD004/gi, 'F D zero zero four')
    .replace(/Su-30MKI/g, 'Sukhoi thirty M K I')
    .replace(/Tejas Mk1A/g, 'Tejas Mark One A')
    .replace(/C-17/g, 'C seventeen')
    .replace(/ALH Rudra/g, 'A L H Rudra')
    .replace(/RUL/g, 'Remaining Useful Life')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 480);
}

/**
 * Synthesizes speech using Sarvam AI's bulbul:v3 model.
 * Always defaults to our valid key to prevent fallback to robotic browser voices.
 */
export async function synthesizeSpeech(text, options = {}) {
  const apiKey = options.apiKey || import.meta.env.VITE_SARVAM_API_KEY || DEFAULT_SARVAM_KEY;
  const speaker = options.speaker || DEFAULT_SPEAKER;
  const cleanText = prepareSpeechText(text);

  if (!cleanText) {
    return { play: () => Promise.resolve(), pause: () => {} };
  }

  const cacheKey = `${speaker}:${cleanText}`;
  if (audioCache.has(cacheKey)) {
    const cachedAudio = audioCache.get(cacheKey);
    cachedAudio.currentTime = 0;
    return cachedAudio;
  }

  // 1. Direct Sarvam AI TTS Request
  if (apiKey) {
    try {
      const resp = await fetch(SARVAM_TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          inputs: [cleanText],
          target_language_code: 'en-IN',
          speaker: speaker,
          model: 'bulbul:v3',
          enable_preprocessing: true,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.audios && data.audios.length > 0) {
          const audio = new Audio(`data:audio/wav;base64,${data.audios[0]}`);
          audioCache.set(cacheKey, audio);
          return audio;
        }
      } else {
        console.warn('Sarvam API returned non-200 status:', resp.status);
      }
    } catch (err) {
      console.warn('Sarvam AI TTS network request failed, falling back to browser synthesis:', err);
    }
  }

  // 2. Fallback to Browser Native Web Speech Synthesis (only if network fails)
  return {
    play: () => {
      return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-IN';
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    },
    pause: () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
  };
}

/**
 * Microphone Speech-to-Text Listener with Reliable Final + Interim Flushing
 * Fixes browser speech recognition dropping interim words when the user stops speaking.
 */
export function createSpeechRecognizer({ onResult, onError, onEnd }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  let lastTranscript = '';
  let hasDispatchedFinal = false;

  recognition.onstart = () => {
    lastTranscript = '';
    hasDispatchedFinal = false;
  };

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    lastTranscript = transcript;
    if (isFinal) {
      hasDispatchedFinal = true;
    }
    if (onResult) onResult(transcript, isFinal);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    // If recognition ended naturally after speaking but the browser never flipped `isFinal: true`,
    // flush the accumulated interim transcript as final so the user's spoken query is never lost.
    if (!hasDispatchedFinal && lastTranscript.trim().length > 0 && onResult) {
      hasDispatchedFinal = true;
      onResult(lastTranscript.trim(), true);
    }
    if (onEnd) onEnd();
  };

  return recognition;
}

/**
 * Authoritative Indian Air Force Flight Line Intelligence
 * Synchronized 1:1 with `digital_twin_engine.py` and `mockFleetData.js` (20 Airframes, C-MAPSS FD001-FD004, RLS Drift)
 */
export function queryVayuBrain(prompt, context = {}) {
  const lower = (prompt || '').toLowerCase();

  // 1. Tail KH-204 (Tejas Mk1A - Grounded LPC / Fuel System Fault)
  if (lower.includes('kh-204') || lower.includes('sulur') || lower.includes('tejas')) {
    return {
      spokenText: "Aircraft KH-204 is a Tejas Mark 1A assigned to Number 45 Squadron Flying Daggers at Sulur Air Force Station. It is currently grounded in Hangar Bay 1 due to Low Pressure Compressor bleed valve and digital fuel metering degradation. Conservative remaining useful life is 19.5 flight hours, with Low Pressure Compressor stage health at 28 percent.",
      displayText: `Tail KH-204 (Tejas Mk1A, No. 45 Squadron "Flying Daggers") is on grounded maintenance hold at AFS Sulur.

Diagnostic Telemetry Summary:
• Engine Configuration: GE F404-GE-IN20 Afterburning Turbofan
• Overall Health Index: 60.8% (MAINTENANCE GROUNDED)
• Point RUL Estimate: 24.8 flight hours | Conservative RUL (90% Lower Bound): 19.5 flight hours
• Conformal Interval: [18.0h, 29.6h]
• Primary Fault Station: Station 24 Low Pressure Compressor (28.0% stage health) & Digital Fuel Metering Valve hysteresis.

Active Remediation:
• Assigned to Hangar Bay 1 (Sulur) for LPC variable stator vane actuator replacement.
• Replacement actuator unit allocated from HAL Engine Division (Bangalore) depot stock.`,
      formulaCard: {
        title: "KH-204 Station 24 Margin",
        formula: "LPC Health = 28.0% | Conservative RUL = 19.5h [18.0h, 29.6h]"
      },
      suggestions: [
        "Compare KH-204 with grounded Rafale RB-004",
        "Show 4-ship formation availability for No. 45 Squadron",
        "Why is tail SB-024 grounded at AFS Thanjavur?"
      ]
    };
  }

  // 2. Tail RB-004 (Rafale EH - Grounded LPT / Turbine Blade Creep)
  if (lower.includes('rb-004') || lower.includes('ambala') || lower.includes('rafale')) {
    return {
      spokenText: "Aircraft RB-004 is a twin-engine Rafale assigned to Number 17 Squadron Golden Arrows at Ambala Air Force Station. It is currently grounded due to Station 50 Low Pressure Turbine thermal fatigue and exhaust gas temperature margin erosion. Low Pressure Turbine stage health is at 24 percent, with a conservative remaining useful life of 17.8 flight hours.",
      displayText: `Tail RB-004 (Rafale EH, No. 17 Squadron "Golden Arrows") is on Aircraft On Ground hold at AFS Ambala.

Diagnostic Telemetry Summary:
• Engine Configuration: Twin Snecma M88-2 Turbofans
• Overall Health Index: 58.6% (MAINTENANCE GROUNDED)
• Point RUL Estimate: 22.0 flight hours | Conservative RUL (90% Lower Bound): 17.8 flight hours
• Conformal Interval: [16.2h, 26.8h]
• Primary Fault Station: Station 50 Low Pressure Turbine (24.0% stage health) & Exhaust Gas Temperature ($T_{50}$) over-temperature creep ($838^{\\circ}\\text{C}$).

Active Remediation:
• Boroscope inspection confirmed thermal barrier coating spallation on LPT Stage 1 blades.
• Single-crystal turbine blade module in priority transit from 3 BRD Chandigarh.`,
      formulaCard: {
        title: "RB-004 LPT Thermal Creep",
        formula: "LPT Health = 24.0% | EGT = 838°C | Cons. RUL = 17.8h"
      },
      suggestions: [
        "Why is tail SB-024 grounded at AFS Thanjavur?",
        "How does Online RLS filter thermocouple sensor drift?",
        "Which 4-ship Rafale formation is cleared for immediate flight?"
      ]
    };
  }

  // 3. Tail SB-024 (Su-30MKI - AOG Grounded HPC Erosion)
  if (lower.includes('sb-024') || lower.includes('grounded') || lower.includes('aog') || lower.includes('thanjavur')) {
    return {
      spokenText: "Aircraft SB-024 is a Sukhoi-30MKI assigned to Number 222 Squadron Tigersharks at Thanjavur Air Force Station. It is on strict Aircraft On Ground status due to Station 30 High Pressure Compressor blade erosion. High Pressure Compressor health is down to 21.2 percent, with a conservative remaining useful life of 16.4 flight hours. An emergency depot requisition is active with 3 BRD Chandigarh.",
      displayText: `Tail SB-024 (Su-30MKI, No. 222 Squadron "Tigersharks") is on critical Aircraft On Ground status in Hangar Bay 2 at AFS Thanjavur.

Diagnostic Telemetry Summary:
• Engine Configuration: Twin Saturn AL-31FP Thrust-Vectoring Turbofans
• Overall Health Index: 56.4% (MAINTENANCE GROUNDED)
• Point RUL Estimate: 21.2 flight hours | Conservative RUL (90% Lower Bound): 16.4 flight hours
• Conformal Interval: [14.8h, 25.4h]
• Root Failure Mode: Station 30 High Pressure Compressor (HPC) blade tip erosion (21.2% stage health) & $T_{50}$ EGT rise ($848^{\\circ}\\text{C}$).
• Forward Base Stock: AFS Thanjavur bin stock for Stage-3 HPC rotor blades is 0 units (below safety threshold of 2).

Remediation Pipeline:
• Work Order WO-2026-089 active in Hangar Bay 2.
• Priority depot transfer REQ-2026-088 dispatched from 3 BRD Chandigarh (ETA 14h via C-17 military airlift).`,
      formulaCard: {
        title: "SB-024 Station 30 HPC Breach",
        formula: "HPC Stage Health = 21.2% | Cons. RUL = 16.4h [14.8h, 25.4h]"
      },
      suggestions: [
        "What is the status of grounded tails KH-204 and RB-004?",
        "Which 4-ship formation is cleared for No. 222 Squadron?",
        "How does predictive ordering prevent AOG downtime?"
      ]
    };
  }

  // 4. NASA C-MAPSS Benchmarks & Online RLS Drift Adaptation
  if (lower.includes('c-mapss') || lower.includes('cmapss') || lower.includes('benchmark') || lower.includes('rmse') || lower.includes('rls') || lower.includes('drift') || lower.includes('fd001') || lower.includes('fd004')) {
    return {
      spokenText: "Our prognostic architecture is benchmarked across all four NASA C-MAPSS turbofan datasets, FD001 through FD004. We achieved test R M S E scores of 12.79 cycles on FD001, 20.44 on FD002, 11.55 on FD003, and 19.84 on FD004, with a 100 percent critical failure catch rate across all 102 test engines. For in-flight thermocouple drift, our online Recursive Least Squares filter with forgetting factor 0.992 reduces error under 1.5x gain drift by 25.6 percent in under 55 microseconds per sample.",
      displayText: `Our prognostic models are validated on the full NASA C-MAPSS benchmark suite (FD001–FD004) plus streaming Recursive Least Squares (RLS) drift adaptation:

Validated NASA C-MAPSS Test Scorecard:
• FD001 (Single Op Condition, HPC Fault): 12.79 RMSE | NASA Asymmetric Score: 237.4 | Critical Catch: 10/10 (100%)
• FD002 (6 Op Conditions / Mach-Altitude, HPC Fault): 20.44 RMSE | Regime-Clustered Z-Score Normalization | Critical Catch: 46/46 (100%)
• FD003 (Single Op Condition, Dual HPC + Fan Fault): 11.55 RMSE | NASA Asymmetric Score: 214.8 | Critical Catch: 10/10 (100%)
• FD004 (6 Op Conditions, Dual HPC + Fan Fault): 19.84 RMSE | GRU-50 + CNN-GRU + LightGBM Ensemble | Critical Catch: 36/36 (100%)

Online RLS Sensor Drift Adaptation (Forgetting Factor λ = 0.992):
• Under 1.5x thermocouple calibration drift, static models degrade while online RLS reduces RMSE from 3.79 to 2.82 (−25.6% error reduction).
• Execution latency is 54.2 µs per telemetry frame on edge FADEC hardware without GPU retraining.`,
      formulaCard: {
        title: "Online RLS Gain Update (λ = 0.992)",
        formula: "RMSE Improvement = 3.79 -> 2.82 (−25.6% under 1.5x Sensor Drift)"
      },
      suggestions: [
        "How does Conformal RUL prevent late predictions?",
        "Explain the 5-stage thermodynamic turbofan twin",
        "Give me a sortie clearance briefing"
      ]
    };
  }

  // 5. Sortie Clearance, Squadron Formation Optimizer & Mission Readiness Briefing
  if (lower.includes('sortie') || lower.includes('clearance') || lower.includes('briefing') || lower.includes('ready') || lower.includes('mission') || lower.includes('formation') || lower.includes('4-ship') || lower.includes('4 ship')) {
    return {
      spokenText: "Mission readiness report: Fleet availability stands at 65 percent across 20 frontline airframes, with 13 mission ready, 4 in scheduled maintenance, and 3 grounded. Our Multi-Aircraft Squadron Formation Optimizer automatically selects the top 2-ship, 4-ship, or 6-ship flight package by ranking conservative remaining useful life margins, while holding lower-R U L tails in Quick Reaction Alert reserve to prevent airframe burnout.",
      displayText: `Fleet Readiness & Multi-Aircraft Formation Status across 20 frontline airframes:

Squadron Readiness Breakdown:
• Fleet Summary: 13 Mission Ready (65.0%) | 4 Scheduled Maintenance (20.0%) | 3 AOG Grounded (15.0%)
• No. 222 Squadron "Tigersharks" (Su-30MKI, Thanjavur): 4 Ready (SB-019, SB-020, SB-021, SB-022), 1 Scheduled (SB-023), 1 AOG (SB-024)
• No. 45 Squadron "Flying Daggers" (Tejas Mk1A, Sulur): 4 Ready (KH-199, KH-200, KH-201, KH-202), 1 Scheduled (KH-203), 1 AOG (KH-204)
• No. 17 Squadron "Golden Arrows" (Rafale, Ambala): 4 Ready (RB-001, RB-002, RB-005, RB-006), 1 Scheduled (RB-003), 1 AOG (RB-004)
• Strategic Airlift & Rotary Support: C-17 (CB-801 Ready) & ALH Rudra (ZD-401 Scheduled)

Formation Optimizer Recommendation (4-Ship Strike Package):
• Cleared Flight Lead & Wingmen (No. 222 Sqn): SB-019 (91.4h Cons. RUL), SB-020 (84.2h), SB-021 (76.8h), SB-022 (68.5h).
• Withheld from High-G Assignment: SB-023 (31.0h Cons. RUL — held for QRA reserve) and SB-024 (16.4h — AOG Hangar Bay 2).`,
      formulaCard: {
        title: "Sortie Clearance Gate",
        formula: "Conservative RUL >= Sortie Hours × Mission Stress Factor (1.40x)"
      },
      suggestions: [
        "Why is tail SB-024 grounded at AFS Thanjavur?",
        "Show NASA C-MAPSS benchmark and RLS drift metrics",
        "What is the status of grounded tails KH-204 and RB-004?"
      ]
    };
  }

  // 6. 5-Stage Thermodynamic Turbofan Twin Physics
  if (lower.includes('5-stage') || lower.includes('gas path') || lower.includes('thermodynamic') || lower.includes('twin physics') || lower.includes('engine') || lower.includes('stations')) {
    return {
      spokenText: "Our digital twin models military turbofans across 5 standard aerospace thermodynamic stations: Station 2 Fan Intake, Station 24 Low Pressure Compressor, Station 30 High Pressure Compressor, Station 40 Combustor and High Pressure Turbine, and Station 50 Low Pressure Turbine and Exhaust. The physics engine tracks temperature, pressure, and vibration residuals in real time.",
      displayText: `Our digital twin models the Saturn AL-31FP, GE F404-GE-IN20, and Snecma M88-2 engines across 5 thermodynamic gas-path stations:

Gas Path Station Breakdown:
• Station 2 (Fan Intake): Monitors inlet temperature $T_2$, pressure $P_2$, and fan speed $N_f$. Detects foreign object damage (FOD) and inlet distortion.
• Station 24 (Low Pressure Compressor): Tracks inter-stage bleed pressure $P_{24}$ and aerodynamic stall margin (critical fault site on KH-204 at 28.0% health).
• Station 30 (High Pressure Compressor): Tracks $T_{30}$ and $P_{30}$ compression ratios to detect blade tip rubbing and erosion (critical fault site on SB-024 at 21.2% health).
• Station 40 (Combustor & HPT): Tracks fuel mass flow $W_f$ and burner exit temperature to detect nozzle guide vane cracking.
• Station 50 (Low Pressure Turbine & Exhaust): Tracks exhaust gas temperature $T_{50}$ and core vibration to detect thermal barrier spallation (critical fault site on RB-004 at 24.0% health).`,
      formulaCard: {
        title: "Thermodynamic Residual Equation",
        formula: "Residual Δ = Measured Station Vector − Regime Baseline (Mach, Alt)"
      },
      suggestions: [
        "Show NASA C-MAPSS benchmark and RLS drift metrics",
        "Why is tail SB-024 grounded at AFS Thanjavur?",
        "How does Conformal RUL calculation work?"
      ]
    };
  }

  // 7. Conformal RUL Prediction & Math
  if (lower.includes('conformal') || lower.includes('rul') || lower.includes('math') || lower.includes('formula') || lower.includes('conservative')) {
    return {
      spokenText: "Point predictions are unsafe in combat aviation because overestimating remaining life by even 5 hours can cause an in-flight engine shutdown. We apply Split Conformal Prediction on empirical validation residuals to compute a guaranteed 90 percent lower bound: Mean R U L minus 1.645 sigma. Sortie clearance strictly requires this conservative lower bound to exceed the mission stress requirement.",
      displayText: `Combat mission planners cannot rely on raw point estimates ($\hat{y}$) because over-predicting engine life carries asymmetric catastrophic penalty.

Split Conformal Prognostic Framework:
• Point Estimate ($\mu$): Produced by our GRU-50 + CNN-GRU + LightGBM ensemble trained on regime-normalized sensor trajectories.
• Empirical Residual Calibration ($\sigma$): Calibrated on held-out run-to-failure trajectories using NASA's asymmetric scoring penalty.
• 90% Lower Confidence Bound: Guarantees with $1 - \alpha = 90\%$ coverage that true remaining life exceeds the clearance threshold before authorizing takeoff.`,
      formulaCard: {
        title: "90% Conformal Lower Bound",
        formula: "Conservative RUL = μ_RUL − 1.645 × σ_cal (90% Coverage Guarantee)"
      },
      suggestions: [
        "Show NASA C-MAPSS benchmark and RLS drift metrics",
        "Give me a sortie clearance briefing",
        "How does predictive ordering prevent AOG downtime?"
      ]
    };
  }

  // 8. Spares & Depot Logistics
  if (lower.includes('spares') || lower.includes('logistics') || lower.includes('inventory') || lower.includes('depot') || lower.includes('lru')) {
    return {
      spokenText: "The logistics integration bridges Forward Operating Base bin inventory with central Base Repair Depots. When an airframe's conservative R U L drops below the depot transit lead time, the platform automatically generates an emergency replenishment order from 3 BRD Chandigarh, 11 BRD Nashik, or HAL Bangalore before the aircraft grounds.",
      displayText: `Closed-loop supply chain synchronization between Forward Operating Bases (FOB) and Base Repair Depots (BRD):

Multi-Echelon Logistics Architecture:
• Forward Operating Bases: Live bin tracking across AFS Thanjavur (Su-30MKI), AFS Sulur (Tejas Mk1A), and AFS Ambala (Rafale).
• Automated Prognostic Reorder Gate: Triggers depot dispatch the moment an aircraft's Conservative RUL crosses below the depot transit lead time ($L_{\\text{depot}} = 36\\text{h}$).
• Connected Central Depots:
  - 3 BRD Chandigarh: Aero-engine overhaul & HPC/LPT rotor blade modules.
  - 11 BRD Ojhar (Nashik): Su-30MKI airframe & hydraulic actuators.
  - HAL Engine Division (Bangalore): GE F404 FADEC & fuel metering units.`,
      formulaCard: {
        title: "Prognostic Reorder Gate",
        formula: "Trigger Requisition iff Conservative RUL < Depot Lead Time (36h)"
      },
      suggestions: [
        "Why is tail SB-024 grounded at AFS Thanjavur?",
        "What is the status of grounded tails KH-204 and RB-004?",
        "Give me a sortie clearance briefing"
      ]
    };
  }

  // 9. Multimodal NLP Snag Fusion
  if (lower.includes('nlp') || lower.includes('snag') || lower.includes('fusion') || lower.includes('pilot log')) {
    return {
      spokenText: "Our multi-modal diagnostic engine fuses unstructured pilot post-flight debrief logs with high-frequency FADEC sensor telemetry. When a pilot reports sluggish throttle response or afterburner rumble, the NLP entity extractor correlates the text against Station 30 pressure and vibration residuals, elevating diagnostic confidence from 76 percent to 98.4 percent.",
      displayText: `Cross-modal diagnostic corroboration between pilot debrief snag logs and FADEC sensor residuals:

Multi-Modal Fusion Pipeline:
• Pilot Debrief Entity Extraction: Parses unstructured technician and pilot remarks (e.g., "mild core rumble during Mach 1.4 climb, slight EGT lag").
• Sensor Residual Alignment: Correlates extracted fault entities with Station 30 ($P_{30}/T_{30}$) and Station 50 ($T_{50}$) anomaly vectors using a K-of-N persistence filter ($K=3, N=5$).
• False-Alarm Suppression: Prevents isolated turbulence spikes or single-frame sensor glitches from triggering unnecessary maintenance groundings.`,
      formulaCard: {
        title: "Cross-Modal Diagnostic Fusion",
        formula: "P(Fault | Text, IoT) = 98.4% (vs 76.0% Sensor-Only Baseline)"
      },
      suggestions: [
        "Show NASA C-MAPSS benchmark and RLS drift metrics",
        "Explain the 5-stage thermodynamic turbofan twin",
        "Why is tail SB-024 grounded at AFS Thanjavur?"
      ]
    };
  }

  // 10. General / Fallback
  return {
    spokenText: `Copy Commander. Evaluating fleet intelligence for your query. Across 20 frontline airframes, 13 are mission ready, 4 are in scheduled maintenance, and 3 are grounded: SB-024 at Thanjavur, KH-204 at Sulur, and RB-004 at Ambala. Select any tactical query below or speak directly to inspect engine telemetry, formation clearance, or depot logistics.`,
    displayText: `VAYU-OPS Flight Line Intelligence is online and synchronized with all 20 frontline airframes.

Active Fleet Snapshot:
• Readiness: 13 Mission Ready | 4 Scheduled Maintenance | 3 Grounded (AOG)
• Grounded Airframes:
  - SB-024 (Su-30MKI, Thanjavur): Station 30 HPC erosion (21.2% stage health, 16.4h Cons. RUL)
  - KH-204 (Tejas Mk1A, Sulur): Station 24 LPC & fuel metering fault (28.0% stage health, 19.5h Cons. RUL)
  - RB-004 (Rafale, Ambala): Station 50 LPT thermal creep (24.0% stage health, 17.8h Cons. RUL)
• Validated Prognostics: NASA C-MAPSS FD001–FD004 (100% critical failure catch rate) + Online RLS Drift Filter ($\lambda = 0.992$).`,
    formulaCard: {
      title: "Fleet Readiness & Prognostic Gate",
      formula: "13/20 Mission Ready (65.0%) | 3 AOG (SB-024, KH-204, RB-004)"
    },
    suggestions: [
      "Give me a sortie clearance briefing",
      "Why is tail SB-024 grounded at AFS Thanjavur?",
      "What is the status of grounded tails KH-204 and RB-004?",
      "Show NASA C-MAPSS benchmark and RLS drift metrics"
    ]
  };
}
