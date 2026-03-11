import React from 'react';
import { Link } from 'react-router-dom';
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
  maxWidth?: '6xl' | '7xl' | 'full';
}

export default function PageLayout({ 
  children, 
  title, 
  showBack = false, 
  backTo = "/", 
  backText = "Back to Hub",
  maxWidth = '6xl'
}: PageLayoutProps) {
  const colors = useThemeColors();

  const maxWidthClass = {
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  }[maxWidth];

  return (
    <div className={`flex flex-col min-h-screen text-zinc-300 font-sans ${colors.selection}`}>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className={`${maxWidthClass} mx-auto px-6 h-16 flex items-center justify-between`}>
          {showBack ? (
            <Link to={backTo} className={`flex items-center gap-2 text-zinc-400 hover:${colors.primary} transition-colors font-medium`}>
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">{backText}</span>
            </Link>
          ) : (
            <div className={`flex items-center gap-2 ${colors.primary} font-mono font-bold text-xl tracking-tight`}>
              <Terminal size={24} className={colors.secondary} />
              <span>Sigma_Games</span>
            </div>
          )}

          {showBack && (
            <div className={`hidden md:flex items-center gap-2 ${colors.primary} font-mono font-bold text-xl tracking-tight`}>
              <Terminal size={24} className={colors.secondary} />
              <span>{title.replace(/\s+/g, '_')}</span>
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

      <main className={`flex-grow ${maxWidthClass} mx-auto px-6 py-12`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-24 py-8 text-sm text-zinc-500 bg-zinc-950/50 backdrop-blur-sm">
        <div className={`${maxWidthClass} mx-auto px-6 text-center`}>
          <p>© 2026 Sigma Games. All rights reserved.</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-600">Entertainment purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
