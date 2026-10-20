import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  AlertTriangle,
  X,
  Mic,
  Search,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SQUADRONS } from '../../data/mockFleetData';
import { fleetApi } from '../../api/fleetApi';

export default function Navbar({ onToggleSidebar }) {
  const {
    isDark,
    toggleTheme,
    activeTab,
    selectedSquadron,
    setSelectedSquadron,
    setSelectedTail,
    setActiveTab,
    isVoiceAgentOpen,
    setIsVoiceAgentOpen
  } = useTheme();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState(false);

  useEffect(() => {
    async function checkApi() {
      try {
        const { isLive } = await fleetApi.getFleetReadiness();
        setIsApiOnline(isLive);
      } catch {
        setIsApiOnline(false);
      }
    }
    checkApi();
    const interval = setInterval(checkApi, 10000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles = {
    overview: { title: 'Fleet Command Overview', breadcrumb: 'Air Power / Command Cockpit' },
    twin: { title: 'Digital Twin & Aircraft Health Monitor', breadcrumb: 'Air Power / 5-Stage Gas-Path' },
    predictive: { title: 'AI/ML Predictive Maintenance & RUL', breadcrumb: 'Air Power / Conformal Prognostics' },
    spares: { title: 'Spares & Logistics Integration', breadcrumb: 'Air Power / Multi-Silo Supply Chain' },
    logs: { title: 'Maintenance Work Orders & Pilot Logs', breadcrumb: 'Air Power / Hangar Execution' },
  };

  const currentMeta = pageTitles[activeTab] || pageTitles.overview;

  const urgentAlerts = [
    {
      id: 1,
      tail: 'SB-024',
      type: 'CRITICAL_AOG',
      msg: 'High-Pressure Compressor (HPC) wear critical (21.2%). Grounded.',
      time: '12m ago',
    },
    {
      id: 2,
      tail: 'AFS Thanjavur',
      type: 'SPARES_DEPLETED',
      msg: 'HPC Rotor Blades (LRU-HPC-01) stock at ZERO. Depot dispatch req active.',
      time: '34m ago',
    },
    {
      id: 3,
      tail: 'KH-204',
      type: 'FUEL_ANOMALY',
      msg: 'Tejas Mk1A HP Fuel pump pressure fluctuation detected during climb.',
      time: '1h ago',
    },
  ];

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 py-2 transition-colors">
      <div
        className={`px-4 sm:px-5 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all duration-300 ${
          isDark
            ? 'bg-[#12131C] border border-white/[0.08] shadow-lg shadow-black/40 text-white'
            : 'bg-white border border-slate-200 shadow-sm text-slate-800'
        }`}
      >
        {/* Left: Mobile Menu & Current Page Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg lg:hidden shrink-0 ${
              isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#8B5CF6] shrink-0" />
            <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentMeta.title}
            </h2>
          </div>
        </div>

        {/* Right: Controls & Navigation Pills */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Squadron Selector Pill */}
          <div className="relative shrink-0">
            <select
              value={selectedSquadron}
              onChange={(e) => setSelectedSquadron(e.target.value)}
              className={`text-xs font-semibold py-1.5 px-3 pr-7 rounded-xl appearance-none cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[190px] sm:max-w-none truncate ${
                isDark
                  ? 'bg-[#181926] text-purple-200 border border-white/[0.08] hover:border-purple-500/40'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              {SQUADRONS.map((sq) => (
                <option key={sq.id} value={sq.id} className="bg-[#12131C] text-white">
                  {sq.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Vayu-AI Voice Agent Trigger (Reference Purple Action Button Style) */}
          <button
            onClick={() => setIsVoiceAgentOpen(!isVoiceAgentOpen)}
            title="Open Vayu-AI Tactical Voice Agent (Sarvam AI bulbul:v3)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
              isVoiceAgentOpen
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40'
                : isDark
                ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 hover:from-violet-500 hover:to-purple-500 text-white border-purple-500/30 shadow-md shadow-purple-950/50'
                : 'bg-purple-600 hover:bg-purple-700 text-white border-transparent'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
            <span className="hidden md:inline font-bold">Vayu-AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#22C55E]" />
          </button>

          {/* Notification Bell */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className={`p-2 rounded-xl transition relative ${
                isDark
                  ? 'bg-[#181926] hover:bg-[#1E2030] text-slate-300 hover:text-white border border-white/[0.08]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-sans font-bold text-white flex items-center justify-center animate-pulse shadow-[0_0_6px_#EF4444]">
                3
              </span>
            </button>

            {/* Notification Menu */}
            {isAlertOpen && (
              <div
                className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn ${
                  isDark
                    ? 'bg-[#141522] border border-white/10 text-white shadow-black/80'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider font-sans">
                      Active Defense Alerts (3)
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAlertOpen(false)}
                    className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-2.5">
                  {urgentAlerts.map((al) => (
                    <div
                      key={al.id}
                      onClick={() => {
                        if (al.tail.startsWith('SB') || al.tail.startsWith('KH') || al.tail.startsWith('RB')) {
                          setSelectedTail(al.tail);
                          setActiveTab('twin');
                        } else {
                          setActiveTab('spares');
                        }
                        setIsAlertOpen(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer border transition flex items-start gap-3 ${
                        isDark
                          ? 'bg-[#181926] hover:bg-[#1E2030] border-white/[0.06]'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-sans text-purple-300 text-xs">
                            {al.tail}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {al.time}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {al.msg}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Commander Profile Badge (Reference Avatar Styling) */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs shrink-0 transition-all ${
              isDark
                ? 'bg-[#181926] border-white/[0.08] hover:border-purple-500/40 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:border-purple-300 text-slate-800'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center font-bold font-sans text-[10px] text-white shadow-sm shrink-0">
              AS
            </div>
            <div className="hidden lg:block text-left leading-none">
              <p className="font-bold tracking-tight text-xs">Air Chief Marshal</p>
              <p className={`text-[9px] font-sans font-medium mt-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                IAF Command
              </p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 shrink-0 shadow-[0_0_6px_#22C55E]" title="Encrypted Defence Link Active" />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Charcoal Dark Mode'}
            className={`p-2 rounded-xl transition-all duration-300 ease-out transform active:scale-90 flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-[#181926] hover:bg-[#1E2030] text-amber-300 border border-white/[0.08]'
                : 'bg-slate-100 hover:bg-slate-200 text-purple-600 border border-slate-200'
            }`}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 transition-transform duration-500 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 transition-transform duration-500 text-purple-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
