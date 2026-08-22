import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, Heart, Sparkles, RefreshCw, RotateCw } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import ProxyIframe from '../components/ProxyIframe';
import { useFavorites } from '../context/FavoritesContext';
import { defaultLuminGames, LuminGameItem } from '../data/lumin';

export default function LuminGames() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<LuminGameItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(90);
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleReload = () => {
    setLoading(true);
    setVisibleCount(90);
    setTimeout(() => {
      setLoading(false);
    }, 400);
  };

  const openGame = (game: LuminGameItem) => {
    setSelectedGame(game);
  };

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return defaultLuminGames;
    return defaultLuminGames.filter(g => g.title.toLowerCase().includes(q));
  }, [search]);

  const displayedGames = useMemo(() => {
    return filteredGames.slice(0, visibleCount);
  }, [filteredGames, visibleCount]);

  return (
    <PageLayout title="Lumin Games">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Lumin games..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(90);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleReload}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayedGames.map((g, index) => {
            const gameId = `lumin:${g.title}`;
            return (
              <div
                key={`${g.id || g.title}-${index}`}
                className="group relative aspect-square overflow-hidden flex flex-col justify-center items-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all text-center will-change-transform"
              >
                <div onClick={() => openGame(g)} className="absolute inset-0 cursor-pointer z-10" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite({
                      id: gameId,
                      title: g.title,
                      url: g.url,
                      image: g.image || '',
                      source: 'Lumin',
                      description: g.description || `Play ${g.title} on Lumin Games.`
                    });
                  }}
                  className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Heart size={16} className={isFavorite(gameId) ? 'fill-red-500 text-red-500' : ''} />
                </button>
                {g.image ? (
                  <>
                    <img 
                      src={g.image} 
                      alt={g.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                      <p className="text-white font-medium text-xs sm:text-sm text-center leading-tight truncate">{g.title}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center p-4 hover:bg-zinc-800/50">
                    <Sparkles className="w-6 h-6 text-cyan-500/40 mb-2 group-hover:text-cyan-400 transition-colors" />
                    <p className="text-white font-medium text-sm break-all line-clamp-3 group-hover:text-cyan-300">
                      {g.title}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          
          {displayedGames.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
              <Box className="w-12 h-12 mb-4 opacity-20" />
              <p>No games found matching your search.</p>
            </div>
          )}
          
          {visibleCount < filteredGames.length && (
            <div className="col-span-full flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount(c => c + 90)}
                className="px-6 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                Load More ({filteredGames.length - visibleCount} Remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Player Overlay */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <h3 className="text-white font-medium pl-2 truncate flex-1">{selectedGame.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const iframe = document.getElementById('lumin-iframe') as HTMLIFrameElement;
                    if (iframe) {
                      const src = iframe.src;
                      iframe.src = 'about:blank';
                      setTimeout(() => { iframe.src = src; }, 50);
                    }
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reload Game"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const gameId = `lumin:${selectedGame.title}`;
                    toggleFavorite({
                      id: gameId,
                      title: selectedGame.title,
                      url: selectedGame.url,
                      image: selectedGame.image || '',
                      source: 'Lumin',
                      description: selectedGame.description || `Play ${selectedGame.title} on Lumin Games.`
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`lumin:${selectedGame.title}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`lumin:${selectedGame.title}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const el = document.getElementById('lumin-iframe') as HTMLIFrameElement;
                     if (el) el.requestFullscreen?.();
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full bg-black relative">
              <ProxyIframe
                id="lumin-iframe"
                src={selectedGame.url}
                className="w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; pointer-lock; keyboard-map; clipboard-write; encrypted-media"
                allowFullScreen
                title={selectedGame.title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
