import React from 'react';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function SettingsMenu() {
  const { settingsViewMode, setIsSettingsOpen } = useTheme();

  if (settingsViewMode === 'box') {
    return (
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        title="Settings"
      >
        <Settings size={20} />
      </button>
    );
  }

  return (
    <Link
      to="/settings"
      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
      title="Settings"
    >
      <Settings size={20} />
    </Link>
  );
}
