import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('vision_ui_theme');
    return saved || 'dark';
  });

  const [selectedSquadron, setSelectedSquadron] = useState('ALL');
  const [selectedTail, setSelectedTail] = useState('SB-021');
  const [activeTab, setActiveTab] = useState('overview'); // overview, twin, predictive, spares, logs
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('air_power_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('air_power_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  useEffect(() => {
    localStorage.setItem('vision_ui_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      isDark: theme === 'dark',
      selectedSquadron,
      setSelectedSquadron,
      selectedTail,
      setSelectedTail,
      activeTab,
      setActiveTab,
      isDocsOpen,
      setIsDocsOpen,
      isVoiceAgentOpen,
      setIsVoiceAgentOpen,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      toggleSidebarCollapse,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
