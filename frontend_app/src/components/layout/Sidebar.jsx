import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  TrendingUp,
  Boxes,
  ClipboardList,
  Shield,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ isOpen, onClose }) {
  const { isDark, activeTab, setActiveTab, setIsDocsOpen } = useTheme();

  const navItems = [
    {
      id: 'overview',
      label: 'Command Overview',
      subtitle: 'Fleet readiness & telemetry',
      icon: LayoutDashboard,
    },
    {
      id: 'twin',
      label: 'Digital Twin & Health',
      subtitle: '5-Stage gas-path telemetry',
      icon: Cpu,
    },
    {
      id: 'predictive',
      label: 'Predictive AI & RUL',
      subtitle: 'Conformal RUL & What-If Sortie',
      icon: TrendingUp,
    },
    {
      id: 'spares',
      label: 'Spares & Logistics',
      subtitle: 'Forward bases & central depot',
      icon: Boxes,
    },
    {
      id: 'logs',
      label: 'Maintenance Work Orders',
      subtitle: 'Triage orders & pilot logs',
      icon: ClipboardList,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between p-4 my-0 lg:my-3 lg:ml-3 lg:rounded-3xl ${
          isDark
            ? 'bg-[#0F1017] border border-white/[0.08] shadow-2xl shadow-black/60 text-white'
            : 'bg-white border border-slate-200 text-slate-800'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="flex items-center gap-3 px-3 py-4 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-base font-extrabold tracking-wide uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Air Power
              </h1>
              <p className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">
                Defense Fleet AI
              </p>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="mt-6">
            <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-sans mb-3">
              Fleet Systems
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 group relative ${
                      isActive
                        ? isDark
                          ? 'bg-[#181926] text-white border border-purple-500/40 shadow-lg shadow-purple-950/40'
                          : 'bg-purple-50 text-purple-900 border border-purple-200'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-tr from-violet-600 to-purple-500 text-white shadow-md shadow-purple-900/40'
                          : isDark
                          ? 'bg-[#181926] text-slate-400 group-hover:text-purple-300 group-hover:bg-[#1E2030]'
                          : 'bg-slate-100 text-slate-500 group-hover:text-purple-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 truncate">
                      <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                      </p>
                      <p className={`text-[10px] truncate ${isActive ? isDark ? 'text-purple-300' : 'text-purple-700' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </p>
                    </div>

                    {isActive && (
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? 'text-purple-300' : 'text-purple-700'}`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Clean Subtle Footer */}
        <div className={`mt-auto pt-4 border-t text-[11px] font-sans flex items-center justify-between ${
          isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22C55E]" />
            <span className="font-medium text-[10px] tracking-wide uppercase text-slate-400">Fleet C2 Active</span>
          </div>
          <button
            onClick={() => setIsDocsOpen(true)}
            className={`hover:underline flex items-center gap-1 text-[11px] font-medium transition ${
              isDark ? 'text-slate-400 hover:text-purple-300' : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Docs
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </aside>
    </>
  );
}
