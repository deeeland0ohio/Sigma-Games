import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Github, ArrowLeft, MessageSquare } from 'lucide-react';
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
  backText = "Back to Games",
  maxWidth = '6xl',
  noPadding = false
}: PageLayoutProps) {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const [showChatWarning, setShowChatWarning] = useState(false);

  const maxWidthClass = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-none'
  }[maxWidth];

  return (
    <div className={`flex flex-col min-h-[100dvh] text-zinc-300 font-sans ${colors.selection}`}>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
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
            <button
              onClick={() => setShowChatWarning(true)}
              className={`p-2 text-zinc-400 hover:${colors.primary} hover:bg-zinc-800 rounded-lg transition-all`}
              title="Global Chat"
            >
              <MessageSquare size={20} />
            </button>
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
        <div className={`${maxWidthClass} mx-auto px-6 text-center`}>
          <p>© 2026 Sigma Games. All rights reserved.</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-600">Entertainment purposes only.</p>
        </div>
      </footer>

      {/* Chat Warning Modal */}
      {showChatWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center`}>
            <h2 className="text-2xl font-bold text-white mb-4">Notice!</h2>
            <p className="text-zinc-400 leading-relaxed mb-8 text-lg">
              If you use the Vercel link chat won't work, you must use <a href="https://ais-pre-sohh6faiwpdjywb75q5qhk-207654894741.us-west2.run.app/" className={`${colors.primary} hover:underline font-bold`} target="_blank" rel="noopener noreferrer">click here</a>
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowChatWarning(false)}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowChatWarning(false);
                  navigate("/chat");
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] ${colors.primaryBg} shadow-lg`}
              >
                Continue to Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
