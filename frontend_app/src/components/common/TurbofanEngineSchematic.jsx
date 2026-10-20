import React, { useState } from 'react';
import { Activity, Flame, ShieldAlert, Sparkles, Wind, Gauge, Layers } from 'lucide-react';

export default function TurbofanEngineSchematic({
  stages = {},
  telemetry = {},
  selectedStage = null,
  onSelectStage = () => {},
  isDark = true,
  aircraftType = 'Su-30MKI (AL-31FP Turbofan)'
}) {
  const [hoveredStage, setHoveredStage] = useState(null);

  // Status color mappings with tactical aerospace glow
  // Status color mappings with tactical aerospace standard (MIL-STD-1472H)
  const getStatusColor = (status, alpha = 1) => {
    if (status === 'CRITICAL') return `rgba(239, 68, 68, ${alpha})`;
    if (status === 'CAUTION') return `rgba(245, 158, 11, ${alpha})`;
    return `rgba(16, 185, 129, ${alpha})`;
  };

  const getStatusStroke = (status) => {
    if (status === 'CRITICAL') return '#EF4444';
    if (status === 'CAUTION') return '#F59E0B';
    return '#10B981';
  };

  const getStatusFill = (status, isHovered, isSelected) => {
    const baseAlpha = isSelected ? 0.35 : isHovered ? 0.28 : 0.12;
    if (status === 'CRITICAL') return `rgba(239, 68, 68, ${baseAlpha})`;
    if (status === 'CAUTION') return `rgba(245, 158, 11, ${baseAlpha})`;
    return `rgba(16, 185, 129, ${baseAlpha})`;
  };

  const fanStatus = stages.fan?.status || 'NOMINAL';
  const lpcStatus = stages.lpc?.status || 'NOMINAL';
  const hpcStatus = stages.hpc?.status || 'CRITICAL';
  const combustorStatus = stages.combustor_hpt?.status || 'NOMINAL';
  const lptStatus = stages.lpt?.status || 'NOMINAL';

  const activeStageKey = hoveredStage || selectedStage;
  const activeStageData = activeStageKey ? stages[activeStageKey] : null;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-700/60' : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Top Header of the Schematic */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
              Interactive 5 Stage Twin Spool Turbofan Schematic
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 font-semibold border border-blue-500/30">
                Stations 2.0 &rarr; 5.0
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">
              Click any gas path stage to inspect station thermodynamic residuals & degradation modes
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-sans">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Nominal
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" /> Advisory
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_#EF4444]" /> Critical
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox="0 0 960 220"
          className="w-full h-auto min-w-[720px] max-h-[220px]"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="casingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#334155" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E293B" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="coreFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
              <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#F97316" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#EF4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
            </linearGradient>

            <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FACC15" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.85" />
            </linearGradient>

            {/* Gas Path Streamline Particle Motion Keyframes */}
            <style>{`
              @keyframes gasPathFlow {
                from { stroke-dashoffset: 36; }
                to { stroke-dashoffset: 0; }
              }
              .streamline-active {
                animation: gasPathFlow 1.8s linear infinite;
              }
              @keyframes pulseCoreGlow {
                0%, 100% { opacity: 0.35; }
                50% { opacity: 0.65; }
              }
              .core-pulse {
                animation: pulseCoreGlow 3s ease-in-out infinite;
              }
            `}</style>

            {/* Glowing filters */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid Pattern */}
          <g opacity="0.08" stroke="#94A3B8" strokeWidth="1">
            <line x1="0" y1="30" x2="960" y2="30" strokeDasharray="4 4" />
            <line x1="0" y1="70" x2="960" y2="70" strokeDasharray="4 4" />
            <line x1="0" y1="110" x2="960" y2="110" strokeDasharray="4 4" />
            <line x1="0" y1="150" x2="960" y2="150" strokeDasharray="4 4" />
            <line x1="0" y1="190" x2="960" y2="190" strokeDasharray="4 4" />
          </g>

          {/* Centerline (Axis of Rotation) */}
          <line
            x1="30"
            y1="110"
            x2="930"
            y2="110"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="6 3 2 3"
            opacity="0.6"
          />
          <text x="35" y="106" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
            CL AXIS
          </text>

          {/* OUTER NACELLE COWLING (AERODYNAMIC NACELLE SHELL) */}
          {/* Top Cowling */}
          <path
            d="M 50 40 Q 150 20 500 20 L 780 28 Q 880 35 910 55 L 900 65 Q 860 48 770 42 L 500 36 Q 160 36 75 52 Z"
            fill="url(#casingGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Bottom Cowling */}
          <path
            d="M 50 180 Q 150 200 500 200 L 780 192 Q 880 185 910 165 L 900 155 Q 860 172 770 178 L 500 184 Q 160 184 75 168 Z"
            fill="url(#casingGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />

          {/* BYPASS AIRFLOW DUCT ARROWS (TOP & BOTTOM) WITH ANIMATED PARTICLES */}
          <g stroke="#38BDF8" strokeWidth="1.8" fill="none" opacity="0.45">
            {/* Top bypass flow lines */}
            <path d="M 170 38 Q 450 32 750 38" strokeDasharray="10 8" className="streamline-active" />
            <path d="M 750 38 L 760 38" markerEnd="url(#arrow)" />
            {/* Bottom bypass flow lines */}
            <path d="M 170 182 Q 450 188 750 182" strokeDasharray="10 8" className="streamline-active" />
          </g>

          {/* INNER CORE CASING (GAS PATH ENVELOPE) WITH THERMAL PULSE */}
          <path
            d="M 180 62 L 280 68 L 440 76 L 560 74 L 660 70 L 760 64 L 880 72 L 880 148 L 760 156 L 660 150 L 560 146 L 440 144 L 280 152 L 180 158 Z"
            fill="url(#coreFlowGrad)"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            className="core-pulse"
          />

          {/* CORE FLOW GAS-PATH STREAMLINES (INNER COMPRESSOR & TURBINE FLOW) */}
          <g stroke="#38BDF8" strokeWidth="1.2" fill="none" opacity="0.35">
            <path d="M 180 82 Q 350 84 560 88 L 880 88" strokeDasharray="8 6" className="streamline-active" />
            <path d="M 180 138 Q 350 136 560 132 L 880 132" strokeDasharray="8 6" className="streamline-active" />
          </g>

          {/* CONCENTRIC SPOOL SHAFTS */}
          {/* Low Pressure Spool Shaft (N1) - Inner Shaft */}
          <rect
            x="140"
            y="107"
            width="630"
            height="6"
            rx="3"
            fill="#0284C7"
            stroke="#38BDF8"
            strokeWidth="1"
            opacity="0.9"
          />
          {/* High Pressure Spool Shaft (N2) - Outer Hollow Sleeve */}
          <rect
            x="290"
            y="103"
            width="340"
            height="14"
            rx="4"
            fill="#1E293B"
            stroke="#F59E0B"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* ======================================================== */}
          {/* STAGE 1: INTAKE & FAN (STA 2.0)                          */}
          {/* ======================================================== */}
          <g
            id="stage-fan"
            onClick={() => onSelectStage('fan')}
            onMouseEnter={() => setHoveredStage('fan')}
            onMouseLeave={() => setHoveredStage(null)}
            className="cursor-pointer transition-all duration-200"
          >
            {/* Interactive Bounding Hitbox */}
            <rect
              x="55"
              y="25"
              width="125"
              height="170"
              rx="12"
              fill={getStatusFill(fanStatus, hoveredStage === 'fan', selectedStage === 'fan')}
              stroke={getStatusStroke(fanStatus)}
              strokeWidth={selectedStage === 'fan' ? 2.5 : hoveredStage === 'fan' ? 2 : 1}
              strokeDasharray={selectedStage === 'fan' ? 'none' : '4 2'}
              filter={fanStatus === 'CRITICAL' ? 'url(#redGlow)' : undefined}
            />

            {/* Spinner Nose Cone */}
            <path
              d="M 60 110 Q 100 88 135 90 L 135 130 Q 100 132 60 110 Z"
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth="1.5"
            />
            {/* Spinner Spiral Stripe */}
            <path
              d="M 75 106 Q 105 95 130 96"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="2"
              opacity="0.8"
            />

            {/* Fan Blades (Titanium Wide Chord) */}
            <g stroke={getStatusStroke(fanStatus)} strokeWidth="2.5" strokeLinecap="round">
              <path d="M 135 48 Q 148 70 142 95" />
              <path d="M 148 44 Q 160 70 154 95" />
              <path d="M 160 42 Q 172 70 166 95" />
              <path d="M 135 172 Q 148 150 142 125" />
              <path d="M 148 176 Q 160 150 154 125" />
              <path d="M 160 178 Q 172 150 166 125" />
            </g>

            {/* Station Tag */}
            <rect x="75" y="6" width="70" height="18" rx="5" fill="#0F172A" stroke={getStatusStroke(fanStatus)} strokeWidth="1" />
            <text x="110" y="19" fill={getStatusStroke(fanStatus)} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
              STA 2.0 &bull; FAN
            </text>
          </g>

          {/* ======================================================== */}
          {/* STAGE 2: LOW-PRESSURE COMPRESSOR (LPC / BOOSTER - STA 24) */}
          {/* ======================================================== */}
          <g
            id="stage-lpc"
            onClick={() => onSelectStage('lpc')}
            onMouseEnter={() => setHoveredStage('lpc')}
            onMouseLeave={() => setHoveredStage(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <rect
              x="185"
              y="58"
              width="100"
              height="104"
              rx="10"
              fill={getStatusFill(lpcStatus, hoveredStage === 'lpc', selectedStage === 'lpc')}
              stroke={getStatusStroke(lpcStatus)}
              strokeWidth={selectedStage === 'lpc' ? 2.5 : hoveredStage === 'lpc' ? 2 : 1}
              strokeDasharray={selectedStage === 'lpc' ? 'none' : '4 2'}
              filter={lpcStatus === 'CRITICAL' ? 'url(#redGlow)' : undefined}
            />

            {/* LPC 3-Stage Rotor/Stator Cascades */}
            <g stroke={getStatusStroke(lpcStatus)} strokeWidth="2" strokeLinecap="round">
              <line x1="205" y1="64" x2="200" y2="102" />
              <line x1="205" y1="156" x2="200" y2="118" />
              <line x1="225" y1="66" x2="220" y2="102" />
              <line x1="225" y1="154" x2="220" y2="118" />
              <line x1="245" y1="67" x2="240" y2="102" />
              <line x1="245" y1="153" x2="240" y2="118" />
              <line x1="265" y1="68" x2="260" y2="102" />
              <line x1="265" y1="152" x2="260" y2="118" />
            </g>

            {/* Station Tag */}
            <rect x="195" y="36" width="80" height="18" rx="5" fill="#0F172A" stroke={getStatusStroke(lpcStatus)} strokeWidth="1" />
            <text x="235" y="49" fill={getStatusStroke(lpcStatus)} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
              STA 24 &bull; LPC
            </text>
          </g>

          {/* ======================================================== */}
          {/* STAGE 3: HIGH-PRESSURE COMPRESSOR (HPC - STA 30)         */}
          {/* ======================================================== */}
          <g
            id="stage-hpc"
            onClick={() => onSelectStage('hpc')}
            onMouseEnter={() => setHoveredStage('hpc')}
            onMouseLeave={() => setHoveredStage(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <rect
              x="290"
              y="68"
              width="150"
              height="84"
              rx="10"
              fill={getStatusFill(hpcStatus, hoveredStage === 'hpc', selectedStage === 'hpc')}
              stroke={getStatusStroke(hpcStatus)}
              strokeWidth={selectedStage === 'hpc' ? 2.8 : hoveredStage === 'hpc' ? 2 : 1.5}
              filter={hpcStatus === 'CRITICAL' ? 'url(#redGlow)' : undefined}
            />

            {/* HPC 9-Stage Axial Blisk Blade Tiers */}
            <g stroke={getStatusStroke(hpcStatus)} strokeWidth="2.2" strokeLinecap="round">
              {[305, 320, 335, 350, 365, 380, 395, 410, 425].map((xPos, idx) => (
                <React.Fragment key={idx}>
                  <line x1={xPos} y1={72 + idx * 0.4} x2={xPos - 3} y2={100} />
                  <line x1={xPos} y1={148 - idx * 0.4} x2={xPos - 3} y2={120} />
                </React.Fragment>
              ))}
            </g>

            {/* Critical Indicator Pulse if Degradation Active */}
            {hpcStatus === 'CRITICAL' && (
              <circle cx="365" cy="110" r="14" fill="rgba(239, 68, 68, 0.25)" stroke="#EF4444" strokeWidth="1.5" className="animate-ping" />
            )}

            {/* Station Tag */}
            <rect x="325" y="46" width="80" height="18" rx="5" fill="#0F172A" stroke={getStatusStroke(hpcStatus)} strokeWidth="1" />
            <text x="365" y="59" fill={getStatusStroke(hpcStatus)} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
              STA 30 &bull; HPC
            </text>
          </g>

          {/* ======================================================== */}
          {/* STAGE 4: COMBUSTOR & HPT (STA 40)                         */}
          {/* ======================================================== */}
          <g
            id="stage-combustor"
            onClick={() => onSelectStage('combustor_hpt')}
            onMouseEnter={() => setHoveredStage('combustor_hpt')}
            onMouseLeave={() => setHoveredStage(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <rect
              x="445"
              y="68"
              width="135"
              height="84"
              rx="10"
              fill={getStatusFill(combustorStatus, hoveredStage === 'combustor_hpt', selectedStage === 'combustor_hpt')}
              stroke={getStatusStroke(combustorStatus)}
              strokeWidth={selectedStage === 'combustor_hpt' ? 2.5 : hoveredStage === 'combustor_hpt' ? 2 : 1}
              strokeDasharray={selectedStage === 'combustor_hpt' ? 'none' : '4 2'}
              filter={combustorStatus === 'CRITICAL' ? 'url(#redGlow)' : undefined}
            />

            {/* Annular Flame Liner & Injectors */}
            <path
              d="M 455 82 Q 500 80 540 82 L 540 98 Q 500 96 455 98 Z"
              fill="url(#flameGrad)"
              stroke="#EA580C"
              strokeWidth="1"
            />
            <path
              d="M 455 138 Q 500 140 540 138 L 540 122 Q 500 124 455 122 Z"
              fill="url(#flameGrad)"
              stroke="#EA580C"
              strokeWidth="1"
            />

            {/* Fuel Nozzle Injector Stems */}
            <line x1="450" y1="74" x2="465" y2="88" stroke="#F97316" strokeWidth="2.5" />
            <line x1="450" y1="146" x2="465" y2="132" stroke="#F97316" strokeWidth="2.5" />

            {/* High Pressure Single Stage Turbine (HPT) */}
            <line x1="565" y1="72" x2="560" y2="100" stroke="#F59E0B" strokeWidth="3" />
            <line x1="565" y1="148" x2="560" y2="120" stroke="#F59E0B" strokeWidth="3" />

            {/* Station Tag */}
            <rect x="465" y="46" width="95" height="18" rx="5" fill="#0F172A" stroke={getStatusStroke(combustorStatus)} strokeWidth="1" />
            <text x="512" y="59" fill={getStatusStroke(combustorStatus)} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
              STA 40 &bull; BURNER
            </text>
          </g>

          {/* ======================================================== */}
          {/* STAGE 5: LOW-PRESSURE TURBINE & NOZZLE (STA 50)          */}
          {/* ======================================================== */}
          <g
            id="stage-lpt"
            onClick={() => onSelectStage('lpt')}
            onMouseEnter={() => setHoveredStage('lpt')}
            onMouseLeave={() => setHoveredStage(null)}
            className="cursor-pointer transition-all duration-200"
          >
            <rect
              x="585"
              y="62"
              width="180"
              height="96"
              rx="10"
              fill={getStatusFill(lptStatus, hoveredStage === 'lpt', selectedStage === 'lpt')}
              stroke={getStatusStroke(lptStatus)}
              strokeWidth={selectedStage === 'lpt' ? 2.5 : hoveredStage === 'lpt' ? 2 : 1}
              strokeDasharray={selectedStage === 'lpt' ? 'none' : '4 2'}
              filter={lptStatus === 'CRITICAL' ? 'url(#redGlow)' : undefined}
            />

            {/* LPT Multi Stage Turbine Disks */}
            <g stroke={getStatusStroke(lptStatus)} strokeWidth="2.5" strokeLinecap="round">
              <line x1="605" y1="68" x2="610" y2="100" />
              <line x1="605" y1="152" x2="610" y2="120" />
              <line x1="630" y1="67" x2="635" y2="100" />
              <line x1="630" y1="153" x2="635" y2="120" />
              <line x1="655" y1="66" x2="660" y2="100" />
              <line x1="655" y1="154" x2="660" y2="120" />
            </g>

            {/* Exhaust Mixer & Afterburner Fuel Rings */}
            <path
              d="M 680 75 Q 730 85 760 90 L 760 130 Q 730 135 680 145"
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
            />
            <circle cx="710" cy="95" r="4" fill="#F97316" />
            <circle cx="710" cy="125" r="4" fill="#F97316" />

            {/* Station Tag */}
            <rect x="625" y="38" width="90" height="18" rx="5" fill="#0F172A" stroke={getStatusStroke(lptStatus)} strokeWidth="1" />
            <text x="670" y="51" fill={getStatusStroke(lptStatus)} fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
              STA 50 &bull; LPT &bull; EGT
            </text>
          </g>

          {/* ======================================================== */}
          {/* EXHAUST NOZZLE VECTORING CONE (STA 80)                   */}
          {/* ======================================================== */}
          <g id="exhaust-nozzle">
            {/* Upper Nozzle Petal */}
            <path
              d="M 765 64 L 880 72 L 910 85 L 890 92 L 765 80 Z"
              fill="#1E293B"
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Lower Nozzle Petal */}
            <path
              d="M 765 156 L 880 148 L 910 135 L 890 128 L 765 140 Z"
              fill="#1E293B"
              stroke="#64748B"
              strokeWidth="1.5"
            />

            {/* Exhaust Plume Glow */}
            <polygon
              points="890,92 945,100 955,110 945,120 890,128"
              fill="url(#flameGrad)"
              opacity="0.65"
            />
          </g>

          {/* SENSOR STATION TELEMETRY READOUTS ALONG BOTTOM DYNAMICALLY BOUND TO LIVE TELEMETRY */}
          <g fontSize="8" fontFamily="JetBrains Mono" fill="#94A3B8">
            <text x="110" y="208" textAnchor="middle">
              {`Nf: ${telemetry.Nf_Fan_RPM || 2388} RPM | BPR: ${telemetry.BPR || 8.42}`}
            </text>
            <text x="235" y="208" textAnchor="middle">
              {`T24: ${telemetry.T24_LPC_Temp_R || 642.3} °R | LPC`}
            </text>
            <text x="365" y="208" textAnchor="middle" fill={hpcStatus === 'CRITICAL' ? '#EF4444' : '#94A3B8'} fontWeight="bold">
              {`T30: ${telemetry.T30_HPC_Temp_R || 1588.0} °R | P30: ${telemetry.P30_HPC_Pres_psia || 553.8} psia`}
            </text>
            <text x="512" y="208" textAnchor="middle">
              {`Nc: ${telemetry.Nc_Core_RPM || 9050.5} RPM | Burner`}
            </text>
            <text x="670" y="208" textAnchor="middle" fill={lptStatus === 'CRITICAL' ? '#EF4444' : '#94A3B8'}>
              {`T50 (EGT): ${telemetry.T50_LPT_Temp_R || 1405.2} °R`}
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Stage Real-time Telemetry HUD Card */}
      {activeStageData && (
        <div className={`mt-3 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-sans transition-all duration-200 ${
          activeStageData.status === 'CRITICAL'
            ? 'bg-red-500/10 border-red-500/30'
            : activeStageData.status === 'CAUTION'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              activeStageData.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
              activeStageData.status === 'CAUTION' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <span className="font-bold text-white tracking-wide">
              {activeStageData.name || activeStageKey.toUpperCase()}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-300">
              Degradation Mode: <strong className={activeStageData.status === 'CRITICAL' ? 'text-red-300' : activeStageData.status === 'CAUTION' ? 'text-amber-300' : 'text-emerald-300'}>{activeStageData.wear_mode || 'Nominal clearance'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              Stage Health: <strong className={
                activeStageData.health_pct < 50 ? 'text-red-400' : activeStageData.health_pct < 75 ? 'text-amber-300' : 'text-emerald-400'
              }>{activeStageData.health_pct}%</strong>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
              activeStageData.status === 'CRITICAL'
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : activeStageData.status === 'CAUTION'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {activeStageData.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}