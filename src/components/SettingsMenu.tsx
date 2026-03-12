import React, { useState, useRef, useEffect } from 'react';
import { Settings, Palette, Monitor, Zap, Bug } from 'lucide-react';
import { useTheme, Theme, BackgroundStyle } from '../context/ThemeContext';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, background, setBackground, simulationPower, setSimulationPower } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseThemes: { id: Theme; label: string; colors: string[] }[] = [
    { id: 'red-green', label: 'Red & Green', colors: ['bg-red-500', 'bg-emerald-500'] },
    { id: 'blue-pink', label: 'Blue & Pink', colors: ['bg-blue-500', 'bg-pink-500'] },
    { id: 'purple-cyan', label: 'Purple & Cyan', colors: ['bg-purple-500', 'bg-cyan-500'] },
    { id: 'orange-yellow', label: 'Orange & Yellow', colors: ['bg-orange-500', 'bg-yellow-500'] },
    { id: 'moonchrome', label: 'Moonchrome', colors: ['bg-zinc-100', 'bg-zinc-400'] },
    { id: 'neon-green', label: 'Neon Green', colors: ['bg-lime-400', 'bg-emerald-500'] },
    { id: 'cyberpunk', label: 'Cyberpunk', colors: ['bg-yellow-400', 'bg-fuchsia-500'] },
    { id: 'synthwave', label: 'Synthwave', colors: ['bg-indigo-500', 'bg-fuchsia-500'] },
    { id: 'dracula', label: 'Dracula', colors: ['bg-purple-400', 'bg-pink-500'] },
    { id: 'hacker', label: 'Hacker', colors: ['bg-emerald-500', 'bg-emerald-700'] },
  ];

  const themes = background === 'lightspeed'
    ? [{ id: 'lightspeed-special', label: 'LIGHTSPEED', colors: ['bg-cyan-400', 'bg-blue-500', 'bg-[#a1cff0]'] } as { id: Theme; label: string; colors: string[] }, ...baseThemes]
    : [...baseThemes, { id: 'lightspeed-special', label: 'Blue Mix', colors: ['bg-cyan-400', 'bg-blue-500', 'bg-[#a1cff0]'] } as { id: Theme; label: string; colors: string[] }];

  const backgrounds: { id: BackgroundStyle; label: string }[] = [
    { id: 'dots', label: 'Interactive Dots' },
    { id: 'matrix', label: 'Matrix Flow' },
    { id: 'black-hole', label: 'Event Horizon' },
    { id: 'lightspeed', label: 'Light Speed' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 max-h-[80vh] overflow-y-auto">
          
          {/* Background Section */}
          <div className="px-4 py-2 border-b border-zinc-800 mb-2 flex items-center gap-2 text-zinc-300">
            <Monitor size={16} />
            <span className="font-semibold text-sm">Background</span>
          </div>
          <div className="space-y-1 px-2 mb-4">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  const prevBg = background;
                  setBackground(bg.id);
                  if (bg.id === 'lightspeed') {
                    setTheme('lightspeed-special');
                  } else if (prevBg === 'lightspeed') {
                    setTheme('red-green');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  background === bg.id 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span>{bg.label}</span>
              </button>
            ))}
          </div>

          {/* Simulation Power Section */}
          <div className="px-4 py-2 border-b border-zinc-800 mb-2 flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-2">
              <Zap size={16} />
              <span className="font-semibold text-sm">Energy</span>
            </div>
            <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">{simulationPower}%</span>
          </div>
          <div className="px-4 mb-4">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={simulationPower}
              onChange={(e) => setSimulationPower(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Theme Section */}
          <div className="px-4 py-2 border-b border-zinc-800 mb-2 flex items-center gap-2 text-zinc-300">
            <Palette size={16} />
            <span className="font-semibold text-sm">Theme Colors</span>
          </div>
          <div className="space-y-1 px-2 mb-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  theme === t.id 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span>{t.label}</span>
                <div className="flex gap-1">
                  {t.colors.map((c, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${c} ${i > 0 ? 'border border-zinc-700' : ''}`} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Reset Section */}
          <div className="px-4 py-3 border-t border-zinc-800 mt-2 space-y-2">
            <button
              onClick={() => {
                setTheme('red-green');
                setBackground('dots');
                setSimulationPower(40);
              }}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reset to Defaults
            </button>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSf5xlht7GbZtnMizaUe8bXjO4cp3k0Y0MDJ2zy9fEiPsxLkkg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Bug size={16} />
              Bug Report / New Game
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
