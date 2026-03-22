import React from 'react';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsMenu() {
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
