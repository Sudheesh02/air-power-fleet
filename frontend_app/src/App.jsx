import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import DocsModal from './components/common/DocsModal';
import TacticalVoiceCopilot from './components/common/TacticalVoiceCopilot';

import CommandOverview from './components/pages/CommandOverview';
import DigitalTwinView from './components/pages/DigitalTwinView';
import PredictiveAnalytics from './components/pages/PredictiveAnalytics';
import SparesLogistics from './components/pages/SparesLogistics';
import MaintenanceLogs from './components/pages/MaintenanceLogs';

function MainLayout() {
  const { isDark, activeTab, isDocsOpen, setIsDocsOpen } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <CommandOverview />;
      case 'twin':
        return <DigitalTwinView />;
      case 'predictive':
        return <PredictiveAnalytics />;
      case 'spares':
        return <SparesLogistics />;
      case 'logs':
        return <MaintenanceLogs />;
      default:
        return <CommandOverview />;
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? 'tactical-mesh-dark text-white'
          : 'tactical-mesh-light text-[#1B2559]'
      }`}
    >
      {/* Vision UI Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-80 flex flex-col min-h-screen transition-all">
        {/* Top Command Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 sm:px-6 pt-2">
          {renderActivePage()}
        </main>

        {/* Tactical Aerospace Footer */}
        <footer className="px-6 py-5 text-center text-xs font-sans border-t border-white/5 text-slate-400">
          <p className="font-semibold text-slate-300">
            SIH 2026 (SIH26249) &bull; Ministry of Defence & Indian Air Force &bull; Air Power Predictive Maintenance Platform
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Engineered with Vision UI Tactical Glassmorphic Architecture &bull; NASA C-MAPSS Digital Twin Engine &bull; Conformal RUL Analytics
          </p>
        </footer>
      </div>

      {/* Technical Documentation Modal */}
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      {/* Vayu-AI Tactical Voice Agent & Chatbot */}
      <TacticalVoiceCopilot />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}
