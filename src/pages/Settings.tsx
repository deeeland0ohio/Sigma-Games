import React from 'react';
import { useTheme, useThemeColors, Theme, BackgroundStyle } from '../context/ThemeContext';
import PageLayout from '../components/PageLayout';
import { Palette, Monitor, Zap, Bug, Sliders, RefreshCw, Layout, Maximize2, Square, Lock, Trash2, Plus, Terminal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function SettingsContent() {
  const { 
    theme, setTheme, 
    background, setBackground, 
    simulationPower, setSimulationPower,
    backgroundConfig, setBackgroundConfig,
    settingsViewMode, setSettingsViewMode,
    setIsSettingsOpen,
    setSettingsBoxSize, setSettingsBoxPosition,
    customColors, setCustomColors,
    cloakingTitle, setCloakingTitle,
    cloakingIcon, setCloakingIcon,
    runnerMode, setRunnerMode
  } = useTheme();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSetViewMode = (mode: 'page' | 'box') => {
    setSettingsViewMode(mode);
    if (mode === 'page') {
      setIsSettingsOpen(false);
      if (location.pathname !== '/settings') {
        navigate('/settings');
      }
    } else {
      if (location.pathname === '/settings') {
        navigate(-1);
        setIsSettingsOpen(true);
      }
    }
  };

  const baseThemes: { id: Theme; label: string; colors: string[] }[] = [
    { id: 'red-green', label: 'Red & Green', colors: ['bg-red-500', 'bg-emerald-500'] },
    { id: 'blue-pink', label: 'Blue & Pink', colors: ['bg-blue-500', 'bg-pink-500'] },
    { id: 'purple-cyan', label: 'Purple & Cyan', colors: ['bg-purple-500', 'bg-cyan-500'] },
    { id: 'orange-yellow', label: 'Orange & Yellow', colors: ['bg-orange-500', 'bg-yellow-500'] },
    { id: 'monochrome', label: 'Monochrome', colors: ['bg-zinc-100', 'bg-zinc-400'] },
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
  themes.push({ id: 'custom', label: 'Custom Theme', colors: [] });

  const backgrounds: { id: BackgroundStyle; label: string }[] = [
    { id: 'dots', label: 'Interactive Dots' },
    { id: 'vanta-dots', label: '3D Dots (Vantajs)' },
    { id: 'matrix', label: 'Matrix Flow' },
    { id: 'black-hole', label: 'Event Horizon' },
    { id: 'lightspeed', label: 'Light Speed' },
    { id: 'blank', label: 'Blank (Black)' },
  ];

  const updateDotsConfig = (key: keyof typeof backgroundConfig.dots, value: number) => {
    setBackgroundConfig({
      ...backgroundConfig,
      dots: { ...backgroundConfig.dots, [key]: value }
    });
  };

  const updateVantaDotsConfig = (key: keyof typeof backgroundConfig.vantaDots, value: number) => {
    setBackgroundConfig({
      ...backgroundConfig,
      vantaDots: { ...backgroundConfig.vantaDots, [key]: value }
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
  const [tempColors, setTempColors] = React.useState(customColors);

  React.useEffect(() => {
    setTempColors(customColors);
  }, [customColors]);

  const toggleAdvanced = () => {
    if (!isAdvanced) {
      setShowWarning(true);
    } else {
      setSimulationPower(Math.min(simulationPower, 100));
      setBackgroundConfig({
        ...backgroundConfig,
        dots: {
          speed: Math.min(backgroundConfig.dots.speed, 150),
          size: Math.min(backgroundConfig.dots.size, 8),
          density: Math.min(backgroundConfig.dots.density, 80),
        },
        vantaDots: {
          springSpeed: Math.min(backgroundConfig.vantaDots.springSpeed, 100),
          dotSize: Math.min(backgroundConfig.vantaDots.dotSize, 20),
          splash: Math.min(backgroundConfig.vantaDots.splash, 100),
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
    <div className="space-y-12">
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
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
      
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6 flex-wrap gap-4">
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
              dots: { speed: 40, size: 2, density: 35 },
              vantaDots: { springSpeed: 38, dotSize: 12, splash: 43 },
              matrix: { speed: 40, size: 40, density: 40 },
              blackHole: { speed: 40, size: 40, density: 40 },
              lightspeed: { speed: 40, size: 40, density: 40 }
            });
            setSettingsViewMode('page');
            setSettingsBoxSize({ width: 1000, height: 700 });
            setSettingsBoxPosition({ x: window.innerWidth / 2 - 500, y: window.innerHeight / 2 - 350 });
            setIsAdvanced(false);
            setCustomColors(['#ffffff', '#ffffff', '#ffffff', '#ffffff']);
            setTempColors(['#ffffff', '#ffffff', '#ffffff', '#ffffff']);
            setCloakingTitle('Sigma Games');
            setCloakingIcon('/favicon.svg?v=2');
            setRunnerMode('none');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all font-medium flex-shrink-0"
        >
          <RefreshCw size={18} />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Left Column: Visuals */}
        <div className="space-y-10">
          <section className="space-y-6 min-w-[300px]">
            <div className="flex items-center gap-3 text-zinc-100">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex-shrink-0">
                <Monitor size={20} style={{ color: colors.hexPrimary }} />
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

          <section className="space-y-6 min-w-[300px]">
            <div className="flex items-center gap-3 text-zinc-100">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex-shrink-0">
                <Palette size={20} style={{ color: colors.hexPrimary }} />
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
                    {t.id === 'custom' ? (
                      customColors.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                      ))
                    ) : (
                      t.colors.map((c, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full ${c} border border-black/20`} />
                      ))
                    )}
                  </div>
                  <span className="text-sm font-medium text-left">{t.label}</span>
                </button>
              ))}
            </div>

            {theme === 'custom' && (
              <div className="mt-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Custom Colors</h3>
                  {tempColors.length < 4 && (
                    <button
                      onClick={() => setTempColors([...tempColors, '#ffffff'])}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus size={14} /> Add Color
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {tempColors.map((color, i) => (
                    <div key={i} className="space-y-2 relative group">
                      <label className="text-xs font-medium text-zinc-400">Color {i + 1}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...tempColors];
                            newColors[i] = e.target.value;
                            setTempColors(newColors);
                          }}
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-sm text-zinc-300 font-mono uppercase">{color}</span>
                        {tempColors.length > 1 && (
                          <button
                            onClick={() => {
                              const newColors = tempColors.filter((_, index) => index !== i);
                              setTempColors(newColors);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all ml-auto"
                            title="Remove color"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCustomColors(tempColors)}
                  className="w-full mt-4 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
                >
                  Save Custom Colors
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Precise Controls */}
        <div className="space-y-10">
          {background !== 'blank' && (
            <section className="space-y-6 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl min-w-[300px]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 text-zinc-100">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex-shrink-0">
                    <Sliders size={20} style={{ color: colors.hexPrimary }} />
                  </div>
                  <h2 className="text-xl font-bold">Precise Controls</h2>
                </div>
                <button
                  onClick={toggleAdvanced}
                  className={`px-4 py-2 rounded-xl font-medium transition-all flex-shrink-0 ${
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
                        <span className="text-xs font-mono text-emerald-400">{(backgroundConfig.dots.speed).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range" min="1" max={150 * multiplier} step="1"
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

                {background === 'vanta-dots' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Spring Speed</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.vantaDots.springSpeed}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.vantaDots.springSpeed}
                        onChange={(e) => updateVantaDotsConfig('springSpeed', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Dot Size</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.vantaDots.dotSize}px</span>
                      </div>
                      <input
                        type="range" min="1" max={20 * multiplier} step="1"
                        value={backgroundConfig.vantaDots.dotSize}
                        onChange={(e) => updateVantaDotsConfig('dotSize', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-zinc-400">Splash</label>
                        <span className="text-xs font-mono text-emerald-400">{backgroundConfig.vantaDots.splash}%</span>
                      </div>
                      <input
                        type="range" min="0" max={100 * multiplier} step="1"
                        value={backgroundConfig.vantaDots.splash}
                        onChange={(e) => updateVantaDotsConfig('splash', parseInt(e.target.value, 10))}
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
          )}

          <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4 min-w-[300px]">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Bug size={18} style={{ color: colors.hexPrimary }} className="flex-shrink-0" />
              Feedback & Support
            </h3>
            <p className="text-sm text-zinc-500">
              Found a bug or have a game suggestion? Let us know through our feedback form.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSf5xlht7GbZtnMizaUe8bXjO4cp3k0Y0MDJ2zy9fEiPsxLkkg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all flex-shrink-0"
            >
              Open Feedback Form
            </a>
          </section>

          <section className="space-y-6 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl min-w-[300px]">
            <div className="flex items-center gap-3 text-zinc-100">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex-shrink-0">
                <Layout size={20} style={{ color: colors.hexPrimary }} />
              </div>
              <h2 className="text-xl font-bold">Settings View</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSetViewMode('page')}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  settingsViewMode === 'page' 
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Maximize2 size={18} />
                <span className="font-medium">Full Page</span>
              </button>
              <button
                onClick={() => handleSetViewMode('box')}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                  settingsViewMode === 'box' 
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Square size={18} />
                <span className="font-medium">Box View</span>
              </button>
            </div>
          </section>

          <section className="space-y-6 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl min-w-[300px]">
            <div className="flex items-center gap-3 text-zinc-100">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex-shrink-0">
                <Lock size={20} style={{ color: colors.hexPrimary }} />
              </div>
              <h2 className="text-xl font-bold">Cloaking</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400">Cloaking Presets</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'default', label: 'Default', title: 'Sigma Games', icon: '/favicon.svg?v=2' },
                    { id: 'google', label: 'Google', title: 'Google', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/500px-Google_%22G%22_logo.svg.png' },
                    { id: 'classroom', label: 'Google Classroom', title: 'Home - Classroom', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Google_Classroom_Logo.svg' },
                    { id: 'ixl', label: 'IXL Learning', title: 'IXL | Dashboard', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/IXL_Learning.png' },
                    { id: 'powerschool', label: 'Schoology (PowerSchool)', title: 'Home | Schoology', icon: 'https://resources.finalsite.net/images/f_auto,q_auto/v1626100427/k12albemarleorg/uj41eppe27bunrvhwnep/PowerSchoolLogos_Vertical-01.png' },
                    { id: 'iready', label: 'i-Ready', title: 'Choose a subject, i-Ready', icon: 'https://assets.clever.com/resource-icons/apps/5148b6242e35482071000011/icon_964188f.png' },
                    { id: 'khan', label: 'Khan Academy', title: 'Khan Academy | Free Online Courses, Lessons & Practice', icon: 'https://www.svgrepo.com/show/353965/khan-academy-icon.svg' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setCloakingTitle(option.title);
                        setCloakingIcon(option.icon);
                      }}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                        cloakingIcon === option.icon
                          ? 'bg-zinc-800 border-zinc-600'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded overflow-hidden bg-white flex items-center justify-center p-1">
                        <img src={option.icon} alt={option.label} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <span className={`text-sm font-medium ${cloakingIcon === option.icon ? 'text-white' : 'text-zinc-400'}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400">Custom Tab Title</label>
                <input
                  type="text"
                  value={cloakingTitle}
                  onChange={(e) => setCloakingTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-zinc-500"
                  placeholder="Enter new tab title"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-medium text-zinc-400">Advanced Cloaking</label>
                <button
                  onClick={() => {
                    const win = window.open('about:blank', '_blank');
                    if (win) {
                      win.document.write(`
                        <html>
                          <head>
                            <title>${cloakingTitle}</title>
                            <link rel="icon" href="${cloakingIcon}">
                          </head>
                          <body style="margin:0;padding:0;overflow:hidden;">
                            <iframe src="${window.location.origin}" style="width:100vw;height:100vh;border:none;"></iframe>
                          </body>
                        </html>
                      `);
                    }
                  }}
                  className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Maximize2 size={18} />
                  Launch in about:blank
                </button>
                <button
                  onClick={() => {
                    const html = `
                      <html>
                        <head>
                          <title>${cloakingTitle}</title>
                          <link rel="icon" href="${cloakingIcon}">
                        </head>
                        <body style="margin:0;padding:0;overflow:hidden;">
                          <iframe src="${window.location.origin}" style="width:100vw;height:100vh;border:none;"></iframe>
                        </body>
                      </html>
                    `;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                  className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Maximize2 size={18} />
                  Launch in blob: URL
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-6 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl min-w-[300px]">
            <div className="flex items-center gap-3 text-zinc-100">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex-shrink-0">
                <Terminal size={20} style={{ color: colors.hexPrimary }} />
              </div>
              <h2 className="text-xl font-bold">Terminal Features</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <div>
                  <span className="font-medium text-white block">HTML Runner</span>
                  <span className="text-sm text-zinc-500">Enable HTML code execution in the home terminal</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${runnerMode === 'html' ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${runnerMode === 'html' ? 'translate-x-6' : 'translate-x-1'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={runnerMode === 'html'}
                    onChange={(e) => setRunnerMode(e.target.checked ? 'html' : 'none')}
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <div>
                  <span className="font-medium text-white block">JavaScript Runner</span>
                  <span className="text-sm text-zinc-500">Enable JavaScript code execution in the home terminal</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${runnerMode === 'javascript' ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${runnerMode === 'javascript' ? 'translate-x-6' : 'translate-x-1'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={runnerMode === 'javascript'}
                    onChange={(e) => setRunnerMode(e.target.checked ? 'javascript' : 'none')}
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <div>
                  <span className="font-medium text-white block">Python Runner</span>
                  <span className="text-sm text-zinc-500">Enable Python code execution in the home terminal</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${runnerMode === 'python' ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${runnerMode === 'python' ? 'translate-x-6' : 'translate-x-1'}`} />
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={runnerMode === 'python'}
                    onChange={(e) => setRunnerMode(e.target.checked ? 'python' : 'none')}
                  />
                </div>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <PageLayout title="Settings" showBack={false}>
      <div className="max-w-4xl mx-auto pb-20">
        <SettingsContent />
      </div>
    </PageLayout>
  );
}
