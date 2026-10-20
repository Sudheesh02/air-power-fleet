import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  TrendingUp,
  Boxes,
  ClipboardList,
  Plane,
  Radio,
  ExternalLink,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ isOpen, onClose }) {
  const {
    isDark,
    activeTab,
    setActiveTab,
    setIsDocsOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse
  } = useTheme();

  const navItems = [
    {
      id: 'overview',
      label: 'Command Overview',
      shortLabel: 'Overview',
      subtitle: 'Fleet readiness & telemetry',
      icon: LayoutDashboard,
    },
    {
      id: 'twin',
      label: 'Digital Twin & Health',
      shortLabel: 'Twin',
      subtitle: '5-Stage gas-path telemetry',
      icon: Cpu,
    },
    {
      id: 'predictive',
      label: 'Predictive AI & RUL',
      shortLabel: 'Prognostics',
      subtitle: 'Conformal RUL & What-If Sortie',
      icon: TrendingUp,
    },
    {
      id: 'spares',
      label: 'Spares & Logistics',
      shortLabel: 'Spares',
      subtitle: 'Forward bases & central depot',
      icon: Boxes,
    },
    {
      id: 'logs',
      label: 'Maintenance Work Orders',
      shortLabel: 'Orders',
      subtitle: 'Triage orders & pilot logs',
      icon: ClipboardList,
    },
    {
      id: 'copilot',
      label: 'Live Voice Copilot',
      shortLabel: 'AI Voice',
      subtitle: 'Voice mode & live chat',
      icon: Radio,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        } w-72 flex flex-col justify-between my-0 lg:my-3 lg:ml-3 lg:rounded-3xl p-3 sm:p-4 ${
          isDark
            ? 'bg-[#171824] border border-[#343448] text-[#F5F4FF] shadow-2xl shadow-black/60'
            : 'bg-white border border-slate-200 text-slate-800'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          {isSidebarCollapsed ? (
            /* COLLAPSED HEADER (Rail Style) */
            <div className={`flex flex-col items-center justify-center py-2 border-b ${isDark ? 'border-[#343448]' : 'border-slate-200'}`}>
              <button
                onClick={toggleSidebarCollapse}
                title="Expand sidebar (Ctrl+B)"
                className="w-10 h-10 rounded-xl bg-blue-700 border border-blue-500/30 flex items-center justify-center text-white shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Plane className="w-5 h-5 -rotate-45" />
              </button>
              <button
                onClick={toggleSidebarCollapse}
                title="Expand sidebar (Ctrl+B)"
                className={`mt-2 p-1.5 rounded-lg transition-all hidden lg:flex items-center justify-center ${
                  isDark
                    ? 'text-[#A7A8C2] hover:text-[#F5F4FF] hover:bg-[#20212F]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* EXPANDED HEADER */
            <div className={`flex items-center justify-between px-2 py-3 border-b ${isDark ? 'border-[#343448]' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-700 border border-blue-500/30 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div className="min-w-0">
                  <h1 className={`text-xs sm:text-sm font-black tracking-wider uppercase leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Air Power Fleet
                  </h1>
                  <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mt-0.5">
                    Defense Fleet AI
                  </p>
                </div>
              </div>

              {/* Desktop Collapse Button */}
              <button
                onClick={toggleSidebarCollapse}
                title="Collapse sidebar (Ctrl+B)"
                className={`p-1.5 rounded-xl transition-all duration-200 hidden lg:flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'text-[#A7A8C2] hover:text-[#F5F4FF] hover:bg-[#20212F]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Section */}
          <div className="mt-5">
            {!isSidebarCollapsed && (
              <p className={`px-3 text-[11px] font-bold uppercase tracking-widest font-sans mb-2.5 ${isDark ? 'text-[#A7A8C2]' : 'text-slate-400'}`}>
                Fleet Systems
              </p>
            )}

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                if (isSidebarCollapsed) {
                  /* COLLAPSED ITEM */
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (onClose) onClose();
                      }}
                      title={`${item.label} · ${item.subtitle}`}
                      className={`w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all duration-200 group relative ${
                        isActive
                          ? 'vision-nav-active text-white'
                          : isDark
                          ? 'text-[#A7A8C2] hover:text-[#F5F4FF] hover:bg-[#20212F]/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-gradient-to-tr from-[#9147FF] to-[#BC83FF] text-white shadow-md shadow-purple-900/40'
                            : isDark
                            ? 'bg-slate-800/80 text-slate-400 group-hover:text-sky-400 group-hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-500 group-hover:text-blue-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <span
                        className={`text-[9px] font-bold tracking-tight text-center mt-1 truncate max-w-full leading-tight ${
                          isActive ? (isDark ? 'text-[#F5F4FF]' : 'text-purple-900') : (isDark ? 'text-[#A7A8C2]' : 'text-slate-500')
                        }`}
                      >
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                }

                /* EXPANDED ITEM */
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-200 group relative ${
                      isActive
                        ? isDark
                          ? 'bg-[#20212F] text-[#F5F4FF] border border-[#9147FF]/50 shadow-lg shadow-purple-950/40'
                          : 'bg-purple-50 text-purple-900 border border-purple-200'
                        : isDark
                        ? 'text-[#A7A8C2] hover:text-[#F5F4FF] hover:bg-[#20212F]/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-tr from-[#9147FF] to-[#BC83FF] text-white shadow-md shadow-purple-900/40'
                          : isDark
                          ? 'bg-slate-800/80 text-slate-400 group-hover:text-sky-400 group-hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-500 group-hover:text-blue-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 truncate">
                      <p className={`text-xs font-bold leading-tight ${isActive ? (isDark ? 'text-[#F5F4FF]' : 'text-purple-950') : ''}`}>
                        {item.label}
                      </p>
                      <p className={`text-[10px] truncate ${isActive ? isDark ? 'text-[#BC83FF]' : 'text-purple-700' : isDark ? 'text-[#A7A8C2]' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </p>
                    </div>

                    {isActive && (
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#BC83FF]' : 'text-purple-700'}`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        {isSidebarCollapsed ? (
          /* COLLAPSED FOOTER */
          <div className={`flex flex-col items-center gap-3 pt-3 border-t ${isDark ? 'border-[#343448]' : 'border-slate-200'}`}>
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#22C55E]"
              title="Fleet C2 Operational & Active"
            />
            <button
              onClick={() => setIsDocsOpen(true)}
              title="Technical Docs (SIH26249 Dossier)"
              className={`p-2 rounded-xl transition ${
                isDark ? 'text-[#A7A8C2] hover:text-[#BC83FF] hover:bg-[#20212F]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* EXPANDED FOOTER */
          <div className={`mt-auto pt-3 border-t text-[11px] font-sans flex items-center justify-between ${
            isDark ? 'border-[#343448] text-[#A7A8C2]' : 'border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#22C55E]" />
              <span className="font-medium text-[10px] tracking-wide uppercase">Fleet C2 Active</span>
            </div>
            <button
              onClick={() => setIsDocsOpen(true)}
              className={`hover:underline flex items-center gap-1 text-[11px] font-medium transition ${
                isDark ? 'text-[#A7A8C2] hover:text-[#BC83FF]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Docs
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
