import React from 'react';
import { useTheme, useThemeColors, Theme, BackgroundStyle } from '../context/ThemeContext';
import PageLayout from '../components/PageLayout';
import { Palette, Monitor, Zap, Bug, ArrowLeft, Sliders, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { 
    theme, setTheme, 
    background, setBackground, 
    simulationPower, setSimulationPower,
    backgroundConfig, setBackgroundConfig 
  } = useTheme();
  const colors = useThemeColors();

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

  const lightspeedTheme = { id: 'lightspeed-special', label: background === 'lightspeed' ? 'LIGHTSPEED' : 'Blue Mix', colors: ['bg-cyan-400', 'bg-blue-500', 'bg-[#a1cff0]'] } as { id: Theme; label: string; colors: string[] };
  const eventHorizonTheme = { id: 'event-horizon-special', label: background === 'black-hole' ? 'SINGULARITY' : 'Violet & Gold', colors: ['bg-violet-600', 'bg-orange-500', 'bg-amber-400', 'bg-rose-600'] } as { id: Theme; label: string; colors: string[] };
  const pointOfNoReturnTheme = { id: 'event-horizon-blue-orange', label: background === 'black-hole' ? 'POINT OF NO RETURN' : 'Cyan & Orange', colors: ['bg-cyan-400', 'bg-orange-500', 'bg-blue-500', 'bg-amber-400'] } as { id: Theme; label: string; colors: string[] };

  let themes = [...baseThemes];
  if (background === 'lightspeed') {
    themes = [lightspeedTheme, ...baseThemes, eventHorizonTheme, pointOfNoReturnTheme];
  } else if (background === 'black-hole') {
    themes = [eventHorizonTheme, pointOfNoReturnTheme, ...baseThemes, lightspeedTheme];
  } else {
    themes = [...baseThemes, lightspeedTheme, eventHorizonTheme, pointOfNoReturnTheme];
  }

  const backgrounds: { id: BackgroundStyle; label: string }[] = [
    { id: 'dots', label: 'Interactive Dots' },
    { id: 'matrix', label: 'Matrix Flow' },
    { id: 'black-hole', label: 'Event Horizon' },
    { id: 'lightspeed', label: 'Light Speed' },
  ];

  const updateDotsConfig = (key: keyof typeof backgroundConfig.dots, value: number) => {
    setBackgroundConfig({
      ...backgroundConfig,
      dots: { ...backgroundConfig.dots, [key]: value }
    });
  };

  const updateMatrixConfig = (key: keyof typeof backgroundConfig.matrix, value: number) => {
    setBackgroundConfig({
      ...backgroundConfig,
      matrix: { ...backgroundConfig.matrix, [key]: value }
    });
  };

  const updateBlackHoleConfig = (key: keyof typeof backgroundConfig.blackHole, value: number) => {
    setBackgroundConfig({
      ...backgroundConfig,
      blackHole: { ...backgroundConfig.blackHole, [key]: value }
    });
  };

  const updateLightspeedConfig = (key: keyof typeof backgroundConfig.lightspeed, value: number) => {
    setBackgroundConfig({
      ...backgroundConfig,
      lightspeed: { ...backgroundConfig.lightspeed, [key]: value }
    });
  };

  const [isAdvanced, setIsAdvanced] = React.useState(false);
  const [showWarning, setShowWarning] = React.useState(false);

  const toggleAdvanced = () => {
    if (!isAdvanced) {
      setShowWarning(true);
    } else {
      // Clamp values when disabling advanced mode
      setSimulationPower(Math.min(simulationPower, 100));
      setBackgroundConfig({
        ...backgroundConfig,
        dots: {
          speed: Math.min(backgroundConfig.dots.speed, 0.15),
          size: Math.min(backgroundConfig.dots.size, 8),
          density: Math.min(backgroundConfig.dots.density, 80),
        },
        matrix: {
          speed: Math.min(backgroundConfig.matrix.speed, 100),
          size: Math.min(backgroundConfig.matrix.size, 100),
          density: Math.min(backgroundConfig.matrix.density, 100),
        },
        blackHole: {
          speed: Math.min(backgroundConfig.blackHole.speed, 100),
          size: Math.min(backgroundConfig.blackHole.size, 100),
          density: Math.min(backgroundConfig.blackHole.density, 100),
        },
        lightspeed: {
          speed: Math.min(backgroundConfig.lightspeed.speed, 100),
          size: Math.min(backgroundConfig.lightspeed.size, 100),
          density: Math.min(backgroundConfig.lightspeed.density, 100),
        },
      });
      setIsAdvanced(false);
    }
  };

  const multiplier = isAdvanced ? 3 : 1;

  return (
    <PageLayout title="Settings" showBack={false}>
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl max-w-sm space-y-4">
            <h3 className="text-xl font-bold text-white">Warning!</h3>
            <p className="text-zinc-300">This is for experimental purposes only, and may cause intense lag.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAdvanced(true);
                  setShowWarning(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
              >
                Enable
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">SYSTEM SETTINGS</h1>
            <p className="text-zinc-500 mt-2">Customize your visual experience and performance.</p>
          </div>
          <button
            onClick={() => {
              setTheme('red-green');
              setBackground('dots');
              setSimulationPower(40);
              setBackgroundConfig({
                dots: { speed: 0.04, size: 2, density: 35 },
                matrix: { speed: 40, size: 25, density: 50 },
                blackHole: { speed: 40, size: 50, density: 50 },
                lightspeed: { speed: 40, size: 50, density: 50 }
              });
              setIsAdvanced(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all font-medium"
          >
            <RefreshCw size={18} />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Visuals */}
          <div className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-zinc-100">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Monitor size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold">Background Style</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      const prevBg = background;
                      setBackground(bg.id);
                      if (bg.id === 'lightspeed') setTheme('lightspeed-special');
                      else if (bg.id === 'black-hole') setTheme('event-horizon-special');
                      else if (prevBg === 'lightspeed' || prevBg === 'black-hole') setTheme('red-green');
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      background === bg.id 
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="font-medium">{bg.label}</span>
                    {background === bg.id && (
                      <div 
                        className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${colors.primaryBg}`}
                        style={{ 
                          boxShadow: `0 0 8px ${colors.hexPrimary}`
                        }} 
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 text-zinc-100">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Palette size={20} className="text-purple-400" />
                </div>
                <h2 className="text-xl font-bold">Theme Colors</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
                      theme === t.id 
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex gap-1.5">
                      {t.colors.map((c, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full ${c} border border-black/20`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-left">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Precise Controls */}
          <div className="space-y-10">
            <section className="space-y-6 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-100">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                    <Sliders size={20} className="text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold">Precise Controls</h2>
                </div>
                <button
                  onClick={toggleAdvanced}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    isAdvanced 
                      ? 'bg-red-600 text-white' 
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {isAdvanced ? 'Advanced (ON)' : 'Advanced'}
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Global Energy */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Zap size={14} /> Global Energy
                    </label>
                    <span className="text-xs font-mono text-emerald-400">{simulationPower}%</span>
                  </div>
                  <input
                    type="range" min="0" max={100 * multiplier} step="1"
                    value={simulationPower}
                    onChange={(e) => setSimulationPower(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Background Specific Controls */}
                {background === 'dots' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Spring Speed</label>
                        <span className="text-xs font-mono text-emerald-400">{(backgroundConfig.dots.speed * 1000).toFixed(0)}</span>
                      </div>
                      <input
                        type="range" min="0.01" max={0.15 * multiplier} step="0.01"
                        value={backgroundConfig.dots.speed}
                        onChange={(e) => updateDotsConfig('speed', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Dot Size</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.dots.size}px</span>
                      </div>
                      <input
                        type="range" min="1" max={8 * multiplier} step="0.5"
                        value={backgroundConfig.dots.size}
                        onChange={(e) => updateDotsConfig('size', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Grid Density</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.dots.density}</span>
                      </div>
                      <input
                        type="range" min="20" max={80 * multiplier} step="1"
                        value={backgroundConfig.dots.density}
                        onChange={(e) => updateDotsConfig('density', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </>
                )}

                {background === 'matrix' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Flow Speed</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.matrix.speed}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.matrix.speed}
                        onChange={(e) => updateMatrixConfig('speed', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Font Size</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.matrix.size}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.matrix.size}
                        onChange={(e) => updateMatrixConfig('size', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Code Density</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.matrix.density}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.matrix.density}
                        onChange={(e) => updateMatrixConfig('density', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </>
                )}

                {background === 'black-hole' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Rotation Speed</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.blackHole.speed}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.blackHole.speed}
                        onChange={(e) => updateBlackHoleConfig('speed', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Hole Size</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.blackHole.size}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.blackHole.size}
                        onChange={(e) => updateBlackHoleConfig('size', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Particle Density</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.blackHole.density}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.blackHole.density}
                        onChange={(e) => updateBlackHoleConfig('density', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </>
                )}

                {background === 'lightspeed' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Travel Speed</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.lightspeed.speed}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.lightspeed.speed}
                        onChange={(e) => updateLightspeedConfig('speed', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Star Size</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.lightspeed.size}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.lightspeed.size}
                        onChange={(e) => updateLightspeedConfig('size', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Star Density</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.lightspeed.density}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.lightspeed.density}
                        onChange={(e) => updateLightspeedConfig('density', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bug size={18} style={{ color: colors.hexPrimary }} />
                Feedback & Support
              </h3>
              <p className="text-sm text-zinc-500">
                Found a bug or have a game suggestion? Let us know through our feedback form.
              </p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSf5xlht7GbZtnMizaUe8bXjO4cp3k0Y0MDJ2zy9fEiPsxLkkg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all"
              >
                Open Feedback Form
              </a>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
