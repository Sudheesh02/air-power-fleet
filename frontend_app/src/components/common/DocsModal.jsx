import React from 'react';
import { X, Shield, Cpu, Activity, Database, Layers, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DocsModal({ isOpen, onClose }) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 transition-all shadow-2xl ${
          isDark
            ? 'bg-slate-900 text-white border border-slate-700/60 shadow-2xl'
            : 'bg-white text-slate-800 border border-slate-200'
        }`}
      >
        {/* 1. MODAL HEADER */}
        <div className="flex items-start justify-between pb-5 border-b border-white/10 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-700 border border-blue-500/30 flex items-center justify-center text-white shadow-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-sky-400 font-semibold border border-blue-500/20 font-sans">
                  SIH26249 &bull; Ministry of Defence
                </span>
                <span className="text-xs text-slate-400 font-sans hidden sm:inline">
                  Operational Reference
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mt-1 font-sans">
                Air Power Predictive Maintenance & Fleet Availability System
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="mt-6 space-y-6 text-sm font-sans">
          {/* Mission Scope Banner */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-blue-500/10 border-blue-500/20 text-slate-300' : 'bg-blue-50 border-blue-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Operational Fleet Scope</span>
            </div>
            <p className="text-xs leading-relaxed">
              Unifies live telemetry, flight snag logs, hangar work orders, and base spares inventory across <strong>20 frontline military aircraft</strong> across combat fighter squadrons and strategic airlift/rotary units: <strong>No. 222 Tigersharks</strong> (Su-30MKI), <strong>No. 45 Flying Daggers</strong> (Tejas Mk1A), <strong>No. 17 Golden Arrows</strong> (Rafale), <strong>No. 81 Skylords</strong> (C-17 Globemaster III), and <strong>No. 116 Helicopter Unit</strong> (ALH Dhruv). Replaces time-based inspections with condition-based maintenance to maximize sortie readiness.
            </p>
          </div>

          {/* Core Technical Systems Grid (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Card: 5-Stage Gas-Path Digital Twin */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      5-Stage Gas-Path Digital Twin
                    </h3>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed mb-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Continuous thermodynamic monitoring maps gas-path degradation across 5 turbofan engine stations:
                </p>
              </div>

              {/* Station Flow List */}
              <div className="space-y-2">
                {[
                  {
                    st: 'Station 02',
                    name: 'Fan & Intake',
                    desc: 'Airflow & inlet total pressure',
                    tags: 'Nf, P2',
                    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
                  },
                  {
                    st: 'Station 24',
                    name: 'Low-Pressure Compressor',
                    desc: 'Intermediate compression & thermal load',
                    tags: 'T24, P24',
                    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
                  },
                  {
                    st: 'Station 30',
                    name: 'High-Pressure Compressor',
                    desc: 'Core pressure ratio & spool velocity',
                    tags: 'T30, P30, Nc',
                    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
                  },
                  {
                    st: 'Station 40',
                    name: 'Combustor & HP Turbine',
                    desc: 'Turbine cooling bleed & thermal degradation',
                    tags: 'W31, HtBleed',
                    badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
                  },
                  {
                    st: 'Station 50',
                    name: 'LP Turbine & Exhaust',
                    desc: 'Exhaust gas temperature (EGT) & thrust margin',
                    tags: 'T50 (EGT)',
                    badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
                  },
                ].map((item) => (
                  <div
                    key={item.st}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                      isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 font-sans ${item.badgeColor}`}>
                        {item.st}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {item.name}
                        </p>
                        <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0 font-sans px-2 py-0.5 rounded bg-black/20">
                      {item.tags}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Conformal RUL & RLS Drift Compensation */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-sky-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Conformal RUL & Drift Adaptation
                    </h3>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed mb-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Operational decision-making backed by rigorous statistical safety envelopes rather than optimistic single-point estimates:
                </p>
              </div>

              {/* Two Feature Explanations */}
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-sky-500/[0.06] border-sky-500/20' : 'bg-sky-50 border-sky-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-xs text-sky-300">
                      Conformal 90% Lower Safety Bound
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 font-sans">
                      &mu; &minus; 1.28&sigma;
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Computes a conservative Remaining Useful Life (RUL) threshold. Aircraft are never cleared on optimistic predictions, preventing unexpected in-flight stress during high-G sorties.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-xs text-emerald-300">
                      Online RLS Sensor Drift Filter
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans">
                      Gain D = 1.5
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Recursive Least Squares tracks real-time sensor calibration shifts, distinguishing normal thermocouple drift from true gas-path deterioration to prevent false groundings.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-white/[0.02] border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs leading-snug">
                    Verified against NASA C-MAPSS FD001-FD004 sub-datasets under varied operating conditions.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Spares-Aware Sortie Clearance Flow */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2 ${
              isDark ? 'text-amber-300' : 'text-amber-700'
            }`}>
              <Sliders className="w-4 h-4" />
              Autonomous Sortie Feasibility & Depot Logistics Pipeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[11px]">1</span>
                  Sortie RUL Gate
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Compares mission duration against the airframe's conservative RUL with a 1.6&times; safety multiplier.
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                  Forward Base Spares
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  If maintenance is needed, queries local hangar stock (e.g., AFS Thanjavur) for required LRU assemblies.
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
                  Depot Requisition
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  If local stock is exhausted, automatically issues an emergency AOG requisition to Central Depot with turnaround ETA.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: System Architecture Specifications */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Platform Engineering Stack</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] text-slate-400 font-medium">User Interface</p>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>React 19 &bull; Vite</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] text-slate-400 font-medium">Design System</p>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>AeroTactical C2 &bull; Tailwind</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] text-slate-400 font-medium">Prognostic Engine</p>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>FastAPI &bull; Python 3.11</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] text-slate-400 font-medium">Relational Database</p>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>SQLite Fleet Store</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MODAL FOOTER */}
        <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/10 flex justify-between items-center text-xs text-slate-400 font-sans">
          <span>Smart India Hackathon 2026 &bull; Ministry of Defence</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 border border-blue-500/40 text-white font-bold shadow-sm transition"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
}
