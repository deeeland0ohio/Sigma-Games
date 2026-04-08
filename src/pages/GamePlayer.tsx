import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { games, allGamesList } from '../data/games';
import { Game } from '../types';
import { ArrowLeft, Maximize2, Terminal, Github, RefreshCcw, Heart, AlertTriangle, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import SettingsMenu from '../components/SettingsMenu';
import Credits from '../components/Credits';
import { useThemeColors } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';

export default function GamePlayer() {
  const { id } = useParams<{ id: string }>();
  const game = games.find(g => g.id === id) || allGamesList.find(g => g.id === id);
  const colors = useThemeColors();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [reloadKey, setReloadKey] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | undefined>(game?.url);
  const navigate = useNavigate();

  useEffect(() => {
    const popupGames = ['crazy-cattle-3d', 'basket-random', 'soccer-random', 'boxing-random', 'geometry-dash', 'basket-bros', 'baseball-bros', 'football-bros', 'wrestle-bros', 'kart-bros', 'soccer-bros'];
    if (id && popupGames.includes(id)) {
      setShowPopup(true);
    }
  }, [id]);

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-400 bg-zinc-950">
        <Terminal size={48} className={`${colors.secondary} mb-4 opacity-50`} />
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Game Not Found</h1>
        <p className="mb-8 text-zinc-500">The requested game could not be located in the system.</p>
        <Link to="/" className={`${colors.primary} hover:opacity-80 flex items-center gap-2 font-medium transition-all`}>
          <ArrowLeft size={16} /> Back to Games
        </Link>
      </div>
    );
  }

  const handleIframeLaunch = () => {
    if (id === 'basket-bros') {
      setIframeUrl('https://basketbros.io/');
    } else if (id === 'baseball-bros') {
      setIframeUrl('https://baseballbros.io/');
    } else if (id === 'football-bros') {
      setIframeUrl('https://footballbros.io/');
    } else if (id === 'wrestle-bros') {
      setIframeUrl('https://wrestlebros.io/');
    } else if (id === 'kart-bros') {
      setIframeUrl('https://kartbros.io/');
    } else if (id === 'soccer-bros') {
      setIframeUrl('https://soccerbros.gg/og/');
    }
    setShowPopup(false);
  };

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

  return (
    <div className={`h-screen w-screen text-zinc-300 font-sans flex flex-col overflow-hidden bg-black ${colors.selection}`}>
      {/* Top Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md shrink-0 z-50 shadow-sm">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <Link to="/all-games" className={`flex items-center gap-2 text-zinc-400 hover:${colors.primary} hover:bg-zinc-800 p-2 rounded-lg transition-all font-medium`}>
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
            <div className={`p-2 bg-zinc-900 rounded-lg border border-zinc-800 ${colors.tertiary || colors.secondary}`}>
              <game.icon size={18} />
            </div>
            <h1 className="font-bold text-white tracking-tight">{game.title}</h1>
            <button 
              onClick={() => game && toggleFavorite(game.id)}
              className={`p-1.5 rounded-lg transition-all ${
                isFavorite(game?.id || '') 
                  ? `${colors.quaternary || colors.secondary} bg-zinc-800/50` 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
              title={isFavorite(game?.id || '') ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={18} className={isFavorite(game?.id || '') ? "fill-current" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/chat"
              className={`p-2 text-zinc-400 hover:${colors.primary} hover:bg-zinc-800 rounded-lg transition-all`}
              title="Global Chat"
            >
              <MessageSquare size={18} />
            </Link>
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
          className="w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {game.type === 'iframe' && (iframeUrl || game.srcdoc) ? (
            <iframe 
              key={reloadKey}
              src={iframeUrl ? `${iframeUrl}${iframeUrl.includes('?') ? '&' : '?'}v=${Date.now()}_${reloadKey}` : undefined}
              srcDoc={game.srcdoc}
              title={game.title}
              className="w-full h-full border-none" 
              allowFullScreen 
            />
          ) : (
            <div className="text-center p-8 max-w-md border border-dashed border-zinc-700 rounded-xl bg-zinc-900/50">
              <Terminal size={48} className="mx-auto text-zinc-600 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Game Content Missing</h2>
              <p className="text-zinc-400 text-sm mb-6">
                This game entry is missing a valid URL or HTML content.
              </p>
            </div>
          )}
        </div>

        {/* Game Specific Popups */}
        {showPopup && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl ${colors.shadow} flex flex-col items-center text-center`}
            >
              <div className={`w-16 h-16 rounded-full ${colors.tertiaryBg || colors.secondaryBg} ${colors.groupHoverQuaternary || colors.groupHoverText || 'text-white'} flex items-center justify-center mb-6`}>
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Notice!</h2>
              <p className="text-zinc-400 leading-relaxed mb-8 text-lg">
                {id === 'basket-bros' || id === 'baseball-bros' || id === 'football-bros' || id === 'wrestle-bros' || id === 'kart-bros' || id === 'soccer-bros' ? (
                  "This code can't support multiplayer, use the iframe launch to play multiplayer. It will also have ads and may be blocked if launched in iframe."
                ) : id === 'geometry-dash'
                  ? "Some levels in this game may be missing some textures so, some levels may be unplayable :("
                  : id === 'basket-random' || id === 'soccer-random' || id === 'boxing-random'
                  ? "The ads you see on this game are NOT from this website they are embedded in the code."
                  : "This website is an ad free unblocked games website, don't worry about the 'unofficial port' popup you will see in game. This website would be classified as an 'other ad-free \"unblocked game\" website'."}
              </p>
              
              {id === 'basket-bros' || id === 'baseball-bros' || id === 'football-bros' || id === 'wrestle-bros' || id === 'kart-bros' || id === 'soccer-bros' ? (
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] bg-zinc-800 hover:bg-zinc-700"
                  >
                    Stay on regular {id === 'basket-bros' ? 'basket bros' : id === 'baseball-bros' ? 'baseball bros' : id === 'football-bros' ? 'football bros' : id === 'wrestle-bros' ? 'wrestle bros' : id === 'kart-bros' ? 'kart bros' : 'soccer bros'}
                  </button>
                  <button
                    onClick={handleIframeLaunch}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${colors.primaryBg} shadow-lg ${colors.shadow}`}
                  >
                    Iframe launch (Highly Recommended)
                  </button>
                  {id === 'soccer-bros' && (
                    <button
                      onClick={() => { setIframeUrl('https://soccerbros.gg/'); setShowPopup(false); }}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${colors.primaryBg} shadow-lg ${colors.shadow}`}
                    >
                      Soccer Bros 2 iframe (Highly Recommended)
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowPopup(false)}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${colors.primaryBg} shadow-lg ${colors.shadow}`}
                >
                  UNDERSTOOD
                </button>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
