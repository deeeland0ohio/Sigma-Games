import { useParams, Link } from 'react-router-dom';
import { games, allGamesList } from '../data/games';
import { Game } from '../types';
import { ArrowLeft, Maximize2, Terminal, Github, RefreshCcw, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import SettingsMenu from '../components/SettingsMenu';
import Credits from '../components/Credits';
import { useThemeColors } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';

declare global {
  interface Window {
    // RufflePlayer removed
  }
}

export default function GamePlayer() {
  const { id } = useParams<{ id: string }>();
  const game = games.find(g => g.id === id) || allGamesList.find(g => g.id === id);
  const colors = useThemeColors();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [reloadKey, setReloadKey] = useState(0);

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-400 bg-zinc-950">
        <Terminal size={48} className={`${colors.secondary} mb-4 opacity-50`} />
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Game Not Found</h1>
        <p className="mb-8 text-zinc-500">The requested game could not be located in the system.</p>
        <Link to="/" className={`${colors.primary} hover:opacity-80 flex items-center gap-2 font-medium transition-all`}>
          <ArrowLeft size={16} /> Return to Hub
        </Link>
      </div>
    );
  }

  const toggleFullscreen = () => {
    const elem = document.getElementById('game-container');
    if (!document.fullscreenElement) {
      elem?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const reloadGame = () => {
    setReloadKey(prev => prev + 1);
  };

  const getGameUrl = () => {
    return game.url || '';
  };

  return (
    <div className={`h-screen w-screen text-zinc-300 font-sans flex flex-col overflow-hidden bg-black ${colors.selection}`}>
      {/* Top Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md shrink-0 z-50 shadow-sm">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <Link to="/all-games" className={`flex items-center gap-2 text-zinc-400 hover:${colors.primary} transition-colors font-medium`}>
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to All Games</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={reloadGame}
              className={`p-2 text-zinc-400 hover:${colors.secondary} hover:bg-zinc-800 rounded-lg transition-all active:rotate-180 duration-500`}
              title="Reload Game"
            >
              <RefreshCcw size={18} />
            </button>
            <div className={`p-2 bg-zinc-900 rounded-lg border border-zinc-800 ${colors.secondary}`}>
              <game.icon size={18} />
            </div>
            <h1 className="font-bold text-white tracking-tight">{game.title}</h1>
            <button 
              onClick={() => game && toggleFavorite(game.id)}
              className={`p-1.5 rounded-lg transition-all ${
                isFavorite(game?.id || '') 
                  ? `${colors.secondary} bg-zinc-800/50` 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
              title={isFavorite(game?.id || '') ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={18} className={isFavorite(game?.id || '') ? "fill-current" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-2">
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
            <button 
              onClick={toggleFullscreen}
              className={`p-2 text-zinc-400 hover:${colors.secondary} hover:bg-zinc-800 rounded-lg transition-colors`}
              title="Toggle Fullscreen"
            >
              <Maximize2 size={20} />
            </button>
            <SettingsMenu />
          </div>
        </div>
      </header>

      {/* Game Container */}
      <main className="flex-1 relative w-full h-full">
        <div 
          id="game-container" 
          className="absolute inset-0 bg-black flex flex-col items-center justify-center"
        >
          {game.type === 'iframe' && (game.url || game.srcdoc) ? (
            <iframe 
              key={reloadKey}
              src={game.url ? getGameUrl() : undefined}
              srcDoc={game.srcdoc}
              className="w-full h-full border-none" 
              allowFullScreen 
            />
          ) : (
            <div className="text-center p-8 max-w-md border border-dashed border-zinc-700 rounded-xl bg-zinc-900/50">
              <Terminal size={48} className="mx-auto text-zinc-600 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Insert Game Code Here</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Open <code className={`${colors.secondary} bg-zinc-950 px-1 py-0.5 rounded`}>src/pages/GamePlayer.tsx</code> and replace this placeholder with your actual game component or iframe.
              </p>
              <div className="text-xs font-mono text-zinc-400 bg-black p-4 rounded-lg text-left overflow-x-auto border border-zinc-800">
                {`{/* Example for React Component */}`}
                <br/>
                <span className={colors.secondary}>{`{game.id === '${game.id}' && <YourGame />}`}</span>
                <br/><br/>
                {`{/* Example for iframe */}`}
                <br/>
                <span className={colors.primary}>{`<iframe src="YOUR_URL" className="w-full h-full" />`}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
