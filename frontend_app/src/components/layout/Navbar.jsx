import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  AlertTriangle,
  X
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
    isSidebarCollapsed,
    toggleSidebarCollapse
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
    copilot: { title: 'Tactical Voice Copilot · Live Operations', breadcrumb: 'Air Power / Live Voice Agent' },
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
        className={`px-4 sm:px-5 py-2 rounded-xl flex items-center justify-between gap-3 transition-all duration-300 ${
          isDark
            ? 'vision-glass border-white/10'
            : 'vision-glass-light border-slate-200'
        }`}
      >
        {/* Left: YouTube Music-style Hamburger Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) {
                toggleSidebarCollapse();
              } else if (onToggleSidebar) {
                onToggleSidebar();
              }
            }}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            className={`p-2 rounded-xl transition-all duration-200 shrink-0 group active:scale-95 ${
              isDark
                ? 'text-white hover:bg-white/10 hover:border-blue-500/40 border border-white/10'
                : 'text-slate-800 hover:bg-slate-100 hover:border-blue-300 border border-slate-200'
            }`}
          >
            <Menu className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 text-slate-400 group-hover:text-sky-400" />
          </button>

          <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentMeta.title}
          </h2>
        </div>

        {/* Right: Controls & Filters */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Squadron Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedSquadron}
              onChange={(e) => setSelectedSquadron(e.target.value)}
              className={`text-xs font-semibold py-1.5 px-3 pr-7 rounded-lg appearance-none cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[210px] sm:max-w-none truncate ${
                isDark
                  ? 'bg-slate-900/90 text-slate-200 border border-white/15'
                  : 'bg-slate-100 text-slate-900 border border-slate-200'
              }`}
            >
              {SQUADRONS.map((sq) => (
                <option key={sq.id} value={sq.id} className="bg-slate-900 text-white">
                  {sq.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Commander Profile Badge (Real Name & Defense Rank) */}
          <div
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs shrink-0 transition-all ${
              isDark
                ? 'bg-slate-900/80 border-white/10 hover:border-blue-500/40 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:border-blue-400 text-slate-800'
            }`}
          >
            <div className="w-5 h-5 rounded-md bg-blue-700 border border-blue-500/30 flex items-center justify-center font-bold font-sans text-[10px] text-white shadow-sm shrink-0">
              AS
            </div>
            <div className="text-left leading-none">
              <p className="font-bold tracking-tight text-xs">Air Chief Marshal A. P. Singh</p>
              <p className={`text-[9px] font-sans font-medium mt-0.5 ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>
                Chief of the Air Staff · IAF
              </p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5 shrink-0" title="Encrypted Defence Link Active" />
          </div>

          {/* Notification Bell with Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className={`p-2 rounded-lg transition relative ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-sans font-bold text-white flex items-center justify-center animate-pulse">
                3
              </span>
            </button>

            {/* Notification Menu */}
            {isAlertOpen && (
              <div
                className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn ${
                  isDark
                    ? 'bg-slate-900 border border-slate-700/60 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
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
                          ? 'bg-white/5 hover:bg-white/10 border-white/5'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-sans text-sky-400 text-xs">
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

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Venus/Purity Light Mode' : 'Switch to Vision UI Dark Mode'}
            className={`p-2 rounded-lg transition-all duration-300 ease-out transform active:scale-90 flex items-center justify-center shrink-0 group ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-white/10 shadow-[0_0_12px_rgba(255,181,71,0.25)] hover:border-amber-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200 shadow-sm hover:border-blue-400/40'
            }`}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-90 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-45 text-blue-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
