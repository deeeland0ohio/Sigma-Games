import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Github, ArrowLeft } from 'lucide-react';
import SettingsMenu from './SettingsMenu';
import Credits from './Credits';
import { useThemeColors } from '../context/ThemeContext';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  backTo?: string;
  backText?: string;
  maxWidth?: '5xl' | '6xl' | '7xl' | 'full';
  noPadding?: boolean;
}

export default function PageLayout({ 
  children, 
  title, 
  showBack = false, 
  backTo = "/", 
  backText = "Back to Home",
  maxWidth = '6xl',
  noPadding = false
}: PageLayoutProps) {
  const colors = useThemeColors();
  const navigate = useNavigate();

  const maxWidthClass = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-none'
  }[maxWidth];

  return (
    <div className={`flex flex-col min-h-[100dvh] text-zinc-300 font-sans ${colors.selection}`}>
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-zinc-950/25 backdrop-blur-md sticky top-0 z-50">
        <div className={`${maxWidthClass} mx-auto px-6 h-20 flex items-center justify-between`}>
          {showBack ? (
            <Link to={backTo} className={`flex items-center gap-2 text-zinc-400 hover:${colors.primary} transition-colors font-medium`}>
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">{backText}</span>
            </Link>
          ) : (
            <Link to="/" className={`flex items-center gap-2 font-mono font-bold text-xl tracking-tight hover:opacity-80 transition-opacity`}>
              <Terminal size={24} className={colors.secondary} />
              <span className={colors.textGradient || colors.primary}>Sigma_Games</span>
            </Link>
          )}

          {showBack && (
            <div className={`hidden md:flex items-center gap-2 font-mono font-bold text-xl tracking-tight`}>
              <Terminal size={24} className={colors.secondary} />
              <span className={colors.textGradient || colors.primary}>{title.replace(/\s+/g, '_')}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/deeeland0ohio"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 text-zinc-400 hover:${colors.secondary} hover:bg-zinc-800 rounded-lg transition-colors`}
              title="GitHub Profile"
            >
              <Github size={20} />
            </a>
            <Credits />
            <SettingsMenu />
          </div>
        </div>
      </header>

      <main className={`flex-grow ${maxWidthClass} ${maxWidth !== 'full' ? 'mx-auto' : ''} ${noPadding ? 'px-0' : 'px-6'} py-4 md:py-6`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-sm text-zinc-500 bg-zinc-950/50 backdrop-blur-sm">
        <div className={`${maxWidthClass} mx-auto px-6 text-center space-y-1`}>
          <p>© 2026 Sigma Games.</p>
          <p className="text-sm text-zinc-600 max-w-2xl mx-auto">Copyright/DMCA should be brought to sources, which are linked in the credits and games will be auto updated if they remove anything.</p>
        </div>
      </footer>
    </div>
  );
}
