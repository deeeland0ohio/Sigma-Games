import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 
  | 'red-green' 
  | 'blue-pink' 
  | 'purple-cyan' 
  | 'orange-yellow' 
  | 'moonchrome' 
  | 'neon-green' 
  | 'cyberpunk' 
  | 'synthwave' 
  | 'dracula' 
  | 'hacker'
  | 'lightspeed-special'
  | 'event-horizon-special'
  | 'event-horizon-blue-orange';

export type BackgroundStyle = 'dots' | 'matrix' | 'black-hole' | 'lightspeed';

export interface BackgroundConfig {
  dots: {
    speed: number;
    size: number;
    density: number;
  };
  matrix: {
    speed: number;
    size: number;
    density: number;
  };
  blackHole: {
    speed: number;
    size: number;
    density: number;
  };
  lightspeed: {
    speed: number;
    size: number;
    density: number;
  };
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  background: BackgroundStyle;
  setBackground: (bg: BackgroundStyle) => void;
  simulationPower: number;
  setSimulationPower: (power: number) => void;
  backgroundConfig: BackgroundConfig;
  setBackgroundConfig: (config: BackgroundConfig) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  settingsViewMode: 'page' | 'box';
  setSettingsViewMode: (mode: 'page' | 'box') => void;
  settingsBoxSize: { width: number; height: number };
  setSettingsBoxSize: (size: { width: number; height: number }) => void;
  settingsBoxPosition: { x: number; y: number };
  setSettingsBoxPosition: (pos: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('app-theme') as Theme) || 'red-green';
  });
  
  const [background, setBackground] = useState<BackgroundStyle>(() => {
    return (localStorage.getItem('app-background') as BackgroundStyle) || 'dots';
  });

  const [simulationPower, setSimulationPower] = useState<number>(() => {
    const saved = localStorage.getItem('app-energy-level');
    return saved ? parseInt(saved, 10) : 40;
  });

  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(() => {
    const saved = localStorage.getItem('app-background-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse background config', e);
      }
    }
    return {
      dots: { speed: 0.04, size: 2, density: 35 },
      matrix: { speed: 40, size: 25, density: 50 },
      blackHole: { speed: 40, size: 50, density: 50 },
      lightspeed: { speed: 40, size: 50, density: 50 }
    };
  });

  const [isSettingsOpen, _setIsSettingsOpen] = useState(false);

  const setIsSettingsOpen = (isOpen: boolean) => {
    if (isOpen) {
      setSettingsBoxPosition({
        x: window.innerWidth / 2 - settingsBoxSize.width / 2,
        y: window.innerHeight / 2 - settingsBoxSize.height / 2
      });
    }
    _setIsSettingsOpen(isOpen);
  };

  const [settingsViewMode, setSettingsViewMode] = useState<'page' | 'box'>(() => {
    return (localStorage.getItem('app-settings-view-mode') as 'page' | 'box') || 'page';
  });

  const [settingsBoxSize, setSettingsBoxSize] = useState(() => {
    const saved = localStorage.getItem('app-settings-box-size');
    return saved ? JSON.parse(saved) : { width: window.innerWidth * 0.52, height: window.innerHeight * 0.65 };
  });

  const [settingsBoxPosition, setSettingsBoxPosition] = useState(() => {
    const saved = localStorage.getItem('app-settings-box-position');
    return saved ? JSON.parse(saved) : { x: window.innerWidth / 2 - 500, y: window.innerHeight / 2 - 350 };
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-background', background);
  }, [background]);

  useEffect(() => {
    localStorage.setItem('app-energy-level', simulationPower.toString());
  }, [simulationPower]);

  useEffect(() => {
    localStorage.setItem('app-background-config', JSON.stringify(backgroundConfig));
  }, [backgroundConfig]);

  useEffect(() => {
    localStorage.setItem('app-settings-view-mode', settingsViewMode);
  }, [settingsViewMode]);

  useEffect(() => {
    localStorage.setItem('app-settings-box-size', JSON.stringify(settingsBoxSize));
  }, [settingsBoxSize]);

  useEffect(() => {
    localStorage.setItem('app-settings-box-position', JSON.stringify(settingsBoxPosition));
  }, [settingsBoxPosition]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, 
      background, setBackground, 
      simulationPower, setSimulationPower,
      backgroundConfig, setBackgroundConfig,
      isSettingsOpen, setIsSettingsOpen,
      settingsViewMode, setSettingsViewMode,
      settingsBoxSize, setSettingsBoxSize,
      settingsBoxPosition, setSettingsBoxPosition
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeColors() {
  const { theme } = useTheme();
  
  const themes: Record<Theme, any> = {
    'red-green': {
      primary: 'text-red-500',
      secondary: 'text-emerald-500',
      tertiaryBg: 'bg-yellow-500', // Added tertiary color
      primaryBg: 'bg-red-500',
      secondaryBg: 'bg-emerald-500',
      hoverBorder: 'hover:border-red-500/50',
      hoverShadow: 'hover:shadow-red-500/10',
      shadow: 'shadow-red-500/10',
      gradientFrom: 'from-red-500/5',
      gradientTo: 'to-emerald-500/5',
      groupHoverText: 'group-hover:text-red-500',
      groupHoverBorder: 'group-hover:border-red-500/30',
      selection: 'selection:bg-red-500/30',
      terminalText: 'text-emerald-400',
      cursor: 'bg-red-500',
      popupBg: 'bg-red-950/90',
      popupText: 'text-red-50',
      hexPrimary: 'rgba(239, 68, 68, 0.4)',
      hexSecondary: 'rgba(16, 185, 129, 0.4)',
      hexMatrix: '#10b981' // emerald-500
    },
    'blue-pink': {
      primary: 'text-blue-500',
      secondary: 'text-pink-500',
      tertiaryBg: 'bg-purple-500',
      primaryBg: 'bg-blue-500',
      secondaryBg: 'bg-pink-500',
      hoverBorder: 'hover:border-blue-500/50',
      hoverShadow: 'hover:shadow-blue-500/10',
      shadow: 'shadow-blue-500/10',
      gradientFrom: 'from-blue-500/5',
      gradientTo: 'to-pink-500/5',
      groupHoverText: 'group-hover:text-blue-500',
      groupHoverBorder: 'group-hover:border-blue-500/30',
      selection: 'selection:bg-blue-500/30',
      terminalText: 'text-pink-400',
      cursor: 'bg-blue-500',
      popupBg: 'bg-blue-950/90',
      popupText: 'text-blue-50',
      hexPrimary: 'rgba(59, 130, 246, 0.4)',
      hexSecondary: 'rgba(236, 72, 153, 0.4)',
      hexMatrix: '#ec4899' // pink-500
    },
    'purple-cyan': {
      primary: 'text-purple-500',
      secondary: 'text-cyan-500',
      tertiaryBg: 'bg-fuchsia-500',
      primaryBg: 'bg-purple-500',
      secondaryBg: 'bg-cyan-500',
      hoverBorder: 'hover:border-purple-500/50',
      hoverShadow: 'hover:shadow-purple-500/10',
      shadow: 'shadow-purple-500/10',
      gradientFrom: 'from-purple-500/5',
      gradientTo: 'to-cyan-500/5',
      groupHoverText: 'group-hover:text-purple-500',
      groupHoverBorder: 'group-hover:border-purple-500/30',
      selection: 'selection:bg-purple-500/30',
      terminalText: 'text-cyan-400',
      cursor: 'bg-purple-500',
      popupBg: 'bg-purple-950/90',
      popupText: 'text-purple-50',
      hexPrimary: 'rgba(168, 85, 247, 0.4)',
      hexSecondary: 'rgba(6, 182, 212, 0.4)',
      hexMatrix: '#06b6d4' // cyan-500
    },
    'orange-yellow': {
      primary: 'text-orange-500',
      secondary: 'text-yellow-500',
      tertiaryBg: 'bg-amber-500',
      primaryBg: 'bg-orange-500',
      secondaryBg: 'bg-yellow-500',
      hoverBorder: 'hover:border-orange-500/50',
      hoverShadow: 'hover:shadow-orange-500/10',
      shadow: 'shadow-orange-500/10',
      gradientFrom: 'from-orange-500/5',
      gradientTo: 'to-yellow-500/5',
      groupHoverText: 'group-hover:text-orange-500',
      groupHoverBorder: 'group-hover:border-orange-500/30',
      selection: 'selection:bg-orange-500/30',
      terminalText: 'text-yellow-400',
      cursor: 'bg-orange-500',
      popupBg: 'bg-orange-950/90',
      popupText: 'text-orange-50',
      hexPrimary: 'rgba(249, 115, 22, 0.4)',
      hexSecondary: 'rgba(234, 179, 8, 0.4)',
      hexMatrix: '#eab308' // yellow-500
    },
    'moonchrome': {
      primary: 'text-zinc-100',
      secondary: 'text-zinc-400',
      tertiaryBg: 'bg-zinc-600',
      primaryBg: 'bg-zinc-100',
      secondaryBg: 'bg-zinc-400',
      hoverBorder: 'hover:border-zinc-100/50',
      hoverShadow: 'hover:shadow-zinc-100/10',
      shadow: 'shadow-zinc-100/10',
      gradientFrom: 'from-zinc-100/5',
      gradientTo: 'to-zinc-400/5',
      groupHoverText: 'group-hover:text-zinc-100',
      groupHoverBorder: 'group-hover:border-zinc-100/30',
      selection: 'selection:bg-zinc-100/30',
      terminalText: 'text-zinc-400',
      cursor: 'bg-zinc-100',
      popupBg: 'bg-zinc-900/95',
      popupText: 'text-zinc-50',
      hexPrimary: 'rgba(244, 244, 245, 0.4)',
      hexSecondary: 'rgba(161, 161, 170, 0.4)',
      hexMatrix: '#f4f4f5' // zinc-100
    },
    'neon-green': {
      primary: 'text-lime-400',
      secondary: 'text-emerald-500',
      tertiaryBg: 'bg-green-400',
      primaryBg: 'bg-lime-400',
      secondaryBg: 'bg-emerald-500',
      hoverBorder: 'hover:border-lime-400/50',
      hoverShadow: 'hover:shadow-lime-400/10',
      shadow: 'shadow-lime-400/10',
      gradientFrom: 'from-lime-400/5',
      gradientTo: 'to-emerald-500/5',
      groupHoverText: 'group-hover:text-lime-400',
      groupHoverBorder: 'group-hover:border-lime-400/30',
      selection: 'selection:bg-lime-400/30',
      terminalText: 'text-emerald-400',
      cursor: 'bg-lime-400',
      popupBg: 'bg-lime-950/90',
      popupText: 'text-lime-50',
      hexPrimary: 'rgba(163, 230, 53, 0.4)',
      hexSecondary: 'rgba(16, 185, 129, 0.4)',
      hexMatrix: '#a3e635' // lime-400
    },
    'cyberpunk': {
      primary: 'text-yellow-400',
      secondary: 'text-fuchsia-500',
      tertiaryBg: 'bg-cyan-400',
      primaryBg: 'bg-yellow-400',
      secondaryBg: 'bg-fuchsia-500',
      hoverBorder: 'hover:border-yellow-400/50',
      hoverShadow: 'hover:shadow-yellow-400/10',
      shadow: 'shadow-yellow-400/10',
      gradientFrom: 'from-yellow-400/5',
      gradientTo: 'to-fuchsia-500/5',
      groupHoverText: 'group-hover:text-yellow-400',
      groupHoverBorder: 'group-hover:border-yellow-400/30',
      selection: 'selection:bg-yellow-400/30',
      terminalText: 'text-fuchsia-400',
      cursor: 'bg-yellow-400',
      popupBg: 'bg-zinc-950/90',
      popupText: 'text-yellow-50',
      hexPrimary: 'rgba(250, 204, 21, 0.4)',
      hexSecondary: 'rgba(217, 70, 239, 0.4)',
      hexMatrix: '#facc15' // yellow-400
    },
    'synthwave': {
      primary: 'text-indigo-500',
      secondary: 'text-fuchsia-500',
      tertiaryBg: 'bg-pink-500',
      primaryBg: 'bg-indigo-500',
      secondaryBg: 'bg-fuchsia-500',
      hoverBorder: 'hover:border-indigo-500/50',
      hoverShadow: 'hover:shadow-indigo-500/10',
      shadow: 'shadow-indigo-500/10',
      gradientFrom: 'from-indigo-500/5',
      gradientTo: 'to-fuchsia-500/5',
      groupHoverText: 'group-hover:text-indigo-500',
      groupHoverBorder: 'group-hover:border-indigo-500/30',
      selection: 'selection:bg-indigo-500/30',
      terminalText: 'text-fuchsia-400',
      cursor: 'bg-indigo-500',
      popupBg: 'bg-indigo-950/90',
      popupText: 'text-indigo-50',
      hexPrimary: 'rgba(99, 102, 241, 0.4)',
      hexSecondary: 'rgba(217, 70, 239, 0.4)',
      hexMatrix: '#d946ef' // fuchsia-500
    },
    'dracula': {
      primary: 'text-purple-400',
      secondary: 'text-pink-500',
      tertiaryBg: 'bg-indigo-400',
      primaryBg: 'bg-purple-400',
      secondaryBg: 'bg-pink-500',
      hoverBorder: 'hover:border-purple-400/50',
      hoverShadow: 'hover:shadow-purple-400/10',
      shadow: 'shadow-purple-400/10',
      gradientFrom: 'from-purple-400/5',
      gradientTo: 'to-pink-500/5',
      groupHoverText: 'group-hover:text-purple-400',
      groupHoverBorder: 'group-hover:border-purple-400/30',
      selection: 'selection:bg-purple-400/30',
      terminalText: 'text-pink-400',
      cursor: 'bg-purple-400',
      popupBg: 'bg-purple-950/90',
      popupText: 'text-purple-50',
      hexPrimary: 'rgba(192, 132, 252, 0.4)',
      hexSecondary: 'rgba(236, 72, 153, 0.4)',
      hexMatrix: '#c084fc' // purple-400
    },
    'hacker': {
      primary: 'text-emerald-500',
      secondary: 'text-emerald-700',
      tertiaryBg: 'bg-lime-500',
      primaryBg: 'bg-emerald-500',
      secondaryBg: 'bg-emerald-700',
      hoverBorder: 'hover:border-emerald-500/50',
      hoverShadow: 'hover:shadow-emerald-500/10',
      shadow: 'shadow-emerald-500/10',
      gradientFrom: 'from-emerald-500/5',
      gradientTo: 'to-emerald-700/5',
      groupHoverText: 'group-hover:text-emerald-500',
      groupHoverBorder: 'group-hover:border-emerald-500/30',
      selection: 'selection:bg-emerald-500/30',
      terminalText: 'text-emerald-500',
      cursor: 'bg-emerald-500',
      popupBg: 'bg-emerald-950/90',
      popupText: 'text-emerald-50',
      hexPrimary: 'rgba(16, 185, 129, 0.4)',
      hexSecondary: 'rgba(4, 120, 87, 0.4)',
      hexMatrix: '#10b981' // emerald-500
    },
    'lightspeed-special': {
      primary: 'text-cyan-400',
      secondary: 'text-blue-500',
      tertiary: 'text-[#a1cff0]',
      quaternary: 'text-cyan-200',
      tertiaryBg: 'bg-[#a1cff0]',
      quaternaryBg: 'bg-cyan-200',
      primaryBg: 'bg-cyan-400',
      secondaryBg: 'bg-blue-500',
      hoverBorder: 'hover:border-cyan-400/50',
      hoverShadow: 'hover:shadow-cyan-400/10',
      shadow: 'shadow-cyan-400/10',
      gradientFrom: 'from-cyan-400/10',
      gradientVia: 'via-blue-500/10',
      gradientTo: 'to-[#a1cff0]/10',
      textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-[#a1cff0]',
      groupHoverText: 'group-hover:text-cyan-400',
      groupHoverQuaternary: 'group-hover:text-cyan-200',
      groupHoverBorder: 'group-hover:border-cyan-400/30',
      focusRing: 'focus:ring-cyan-400',
      focusBorder: 'focus:border-cyan-400',
      selection: 'selection:bg-cyan-400/30',
      terminalText: 'text-cyan-400',
      cursor: 'bg-cyan-400',
      popupBg: 'bg-cyan-950/90',
      popupText: 'text-cyan-50',
      hexPrimary: '#00FFFF',
      hexSecondary: '#3B82F6',
      hexTertiary: '#a1cff0',
      hexQuaternary: '#a8f0ff',
      hexMatrix: '#00FFFF'
    },
    'event-horizon-special': {
      primary: 'text-violet-500',
      secondary: 'text-orange-500',
      tertiary: 'text-amber-400',
      quaternary: 'text-rose-600',
      tertiaryBg: 'bg-amber-400',
      quaternaryBg: 'bg-rose-600',
      primaryBg: 'bg-violet-600',
      secondaryBg: 'bg-orange-500',
      hoverBorder: 'hover:border-violet-500/50',
      hoverShadow: 'hover:shadow-violet-500/10',
      shadow: 'shadow-violet-500/10',
      gradientFrom: 'from-violet-500/10',
      gradientVia: 'via-orange-500/10',
      gradientTo: 'to-amber-400/10',
      textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-orange-500 to-amber-400',
      groupHoverText: 'group-hover:text-violet-500',
      groupHoverQuaternary: 'group-hover:text-rose-600',
      groupHoverBorder: 'group-hover:border-violet-500/30',
      focusRing: 'focus:ring-violet-500',
      focusBorder: 'focus:border-violet-500',
      selection: 'selection:bg-violet-500/30',
      terminalText: 'text-orange-400',
      cursor: 'bg-violet-500',
      popupBg: 'bg-violet-950/90',
      popupText: 'text-violet-50',
      hexPrimary: 'rgba(139, 92, 246, 0.4)', // violet-500
      hexSecondary: 'rgba(249, 115, 22, 0.4)', // orange-500
      hexTertiary: '#fbbf24', // amber-400
      hexQuaternary: '#e11d48', // rose-600
      hexMatrix: '#8b5cf6' // violet-500
    },
    'event-horizon-blue-orange': {
      primary: 'text-blue-400',
      secondary: 'text-orange-500',
      tertiary: 'text-cyan-400',
      quaternary: 'text-amber-400',
      tertiaryBg: 'bg-cyan-400',
      quaternaryBg: 'bg-amber-400',
      primaryBg: 'bg-blue-500',
      secondaryBg: 'bg-orange-500',
      hoverBorder: 'hover:border-blue-400/50',
      hoverShadow: 'hover:shadow-blue-400/10',
      shadow: 'shadow-blue-400/10',
      gradientFrom: 'from-blue-400/10',
      gradientVia: 'via-cyan-400/10',
      gradientTo: 'to-orange-500/10',
      textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-orange-500',
      groupHoverText: 'group-hover:text-blue-400',
      groupHoverQuaternary: 'group-hover:text-amber-400',
      groupHoverBorder: 'group-hover:border-blue-400/30',
      focusRing: 'focus:ring-blue-400',
      focusBorder: 'focus:border-blue-400',
      selection: 'selection:bg-blue-400/30',
      terminalText: 'text-blue-400',
      cursor: 'bg-blue-400',
      popupBg: 'bg-blue-950/90',
      popupText: 'text-blue-50',
      hexPrimary: 'rgba(59, 130, 246, 0.6)', // blue-500
      hexSecondary: 'rgba(249, 115, 22, 0.6)', // orange-500
      hexTertiary: '#22d3ee', // cyan-400
      hexQuaternary: '#fbbf24', // amber-400
      hexMatrix: '#3b82f6' // blue-500
    }
  };

  return themes[theme] || themes['red-green'];
}
