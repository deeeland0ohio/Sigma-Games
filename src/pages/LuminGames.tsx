import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, Sparkles, RefreshCw, RotateCw, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import ContentFrame from '../components/ContentFrame';
import { useFavorites } from '../context/FavoritesContext';
import { defaultLuminGames, LuminGameItem } from '../data/lumin';

export default function LuminGames() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<LuminGameItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
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
    <PageLayout title="Lumin Games" maxWidth="wide" showBack={true}>
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

        <div className="game-source-grid">
          {displayedGames.map((g, index) => {
            const gameId = `lumin:${g.title}`;
            return (
              <SourceGameCard
                key={`${g.id || g.title}-${index}`}
                index={index}
                title={g.title}
                image={g.image || null}
                onClick={() => openGame(g)}
                isFavorite={isFavorite(gameId)}
                onToggleFavorite={() => {
                  toggleFavorite({
                    id: gameId,
                    title: g.title,
                    url: g.url,
                    image: g.image || '',
                    source: 'Lumin',
                    description: g.description || `Play ${g.title} on Lumin Games.`
                  });
                }}
                fallbackIcon={Sparkles}
                fallbackIconClassName="text-cyan-400"
                hoverBorderClass="hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              />
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
                  onClick={() => setReloadKey(k => k + 1)}
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
              <ContentFrame
                key={reloadKey}
                reloadKey={reloadKey}
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
