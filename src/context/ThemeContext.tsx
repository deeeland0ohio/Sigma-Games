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
  | 'hacker';

export type BackgroundStyle = 'dots' | 'matrix' | 'black-hole';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  background: BackgroundStyle;
  setBackground: (bg: BackgroundStyle) => void;
  simulationPower: number;
  setSimulationPower: (power: number) => void;
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

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-background', background);
  }, [background]);

  useEffect(() => {
    localStorage.setItem('app-energy-level', simulationPower.toString());
  }, [simulationPower]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, background, setBackground, simulationPower, setSimulationPower }}>
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
      gradientFrom: 'from-red-500/5',
      gradientTo: 'to-emerald-500/5',
      groupHoverText: 'group-hover:text-red-500',
      groupHoverBorder: 'group-hover:border-red-500/30',
      selection: 'selection:bg-red-500/30',
      terminalText: 'text-emerald-400',
      cursor: 'bg-red-500',
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
      gradientFrom: 'from-blue-500/5',
      gradientTo: 'to-pink-500/5',
      groupHoverText: 'group-hover:text-blue-500',
      groupHoverBorder: 'group-hover:border-blue-500/30',
      selection: 'selection:bg-blue-500/30',
      terminalText: 'text-pink-400',
      cursor: 'bg-blue-500',
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
      gradientFrom: 'from-purple-500/5',
      gradientTo: 'to-cyan-500/5',
      groupHoverText: 'group-hover:text-purple-500',
      groupHoverBorder: 'group-hover:border-purple-500/30',
      selection: 'selection:bg-purple-500/30',
      terminalText: 'text-cyan-400',
      cursor: 'bg-purple-500',
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
      gradientFrom: 'from-orange-500/5',
      gradientTo: 'to-yellow-500/5',
      groupHoverText: 'group-hover:text-orange-500',
      groupHoverBorder: 'group-hover:border-orange-500/30',
      selection: 'selection:bg-orange-500/30',
      terminalText: 'text-yellow-400',
      cursor: 'bg-orange-500',
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
      gradientFrom: 'from-zinc-100/5',
      gradientTo: 'to-zinc-400/5',
      groupHoverText: 'group-hover:text-zinc-100',
      groupHoverBorder: 'group-hover:border-zinc-100/30',
      selection: 'selection:bg-zinc-100/30',
      terminalText: 'text-zinc-400',
      cursor: 'bg-zinc-100',
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
      gradientFrom: 'from-lime-400/5',
      gradientTo: 'to-emerald-500/5',
      groupHoverText: 'group-hover:text-lime-400',
      groupHoverBorder: 'group-hover:border-lime-400/30',
      selection: 'selection:bg-lime-400/30',
      terminalText: 'text-emerald-400',
      cursor: 'bg-lime-400',
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
      gradientFrom: 'from-yellow-400/5',
      gradientTo: 'to-fuchsia-500/5',
      groupHoverText: 'group-hover:text-yellow-400',
      groupHoverBorder: 'group-hover:border-yellow-400/30',
      selection: 'selection:bg-yellow-400/30',
      terminalText: 'text-fuchsia-400',
      cursor: 'bg-yellow-400',
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
      gradientFrom: 'from-indigo-500/5',
      gradientTo: 'to-fuchsia-500/5',
      groupHoverText: 'group-hover:text-indigo-500',
      groupHoverBorder: 'group-hover:border-indigo-500/30',
      selection: 'selection:bg-indigo-500/30',
      terminalText: 'text-fuchsia-400',
      cursor: 'bg-indigo-500',
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
      gradientFrom: 'from-purple-400/5',
      gradientTo: 'to-pink-500/5',
      groupHoverText: 'group-hover:text-purple-400',
      groupHoverBorder: 'group-hover:border-purple-400/30',
      selection: 'selection:bg-purple-400/30',
      terminalText: 'text-pink-400',
      cursor: 'bg-purple-400',
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
      gradientFrom: 'from-emerald-500/5',
      gradientTo: 'to-emerald-700/5',
      groupHoverText: 'group-hover:text-emerald-500',
      groupHoverBorder: 'group-hover:border-emerald-500/30',
      selection: 'selection:bg-emerald-500/30',
      terminalText: 'text-emerald-500',
      cursor: 'bg-emerald-500',
      hexPrimary: 'rgba(16, 185, 129, 0.4)',
      hexSecondary: 'rgba(4, 120, 87, 0.4)',
      hexMatrix: '#10b981' // emerald-500
    }
  };

  return themes[theme] || themes['red-green'];
}
