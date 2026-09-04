import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, RefreshCw, Loader2, Crown, RotateCw, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import ContentFrame from '../components/ContentFrame';
import { useFavorites } from '../context/FavoritesContext';
import { cvkGames, CvkGameItem } from '../data/cvk';

export default function CvkGames() {
  const [games, setGames] = useState<CvkGameItem[]>(cvkGames);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<CvkGameItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(60);
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadCvkGames = async () => {
    setLoading(true);
    try {
      // Fetch dynamic games list using quantil CDN as mandated
      const res = await fetch("https://cdn.jsdelivr.net/gh/WanoCapy/ChickenKingsVault@main/games.js");
      if (res.ok) {
        const text = await res.text();
        const regex = /<a class="game-link" href="([^"]+)">\s*<img src="([^"]+)" alt="([^"]*)">\s*<div>([^<]+)<\/div>\s*<\/a>/g;
        const parsed: CvkGameItem[] = [];
        let m;
        while ((m = regex.exec(text)) !== null) {
          const file = m[1];
          const image = m[2];
          const title = m[4].trim();
          parsed.push({
            title,
            file,
            url: `https://cdn.jsdelivr.net/gh/WanoCapy/ChickenKingsVault@main/${file}`,
            image: `https://cdn.jsdelivr.net/gh/WanoCapy/ChickenKingsVault@main/${image}`
          });
        }
        if (parsed.length > 0) {
          parsed.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));
          setGames(parsed);
        }
      }
    } catch (err) {
      console.warn("Dynamic CVK fetch note, using bundled library cache:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCvkGames();
  }, []);

  const openGame = (game: CvkGameItem) => {
    setSelectedGame(game);
  };

  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase())
  );
  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <PageLayout title="Chicken King's Vault (CVK)" maxWidth="wide" showBack={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search CVK collection..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={loadCvkGames}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-zinc-500 text-sm font-medium">Loading Chicken King's Vault games...</p>
          </div>
        ) : (
          <div className="game-source-grid">
            {displayedGames.map((g, index) => {
              const gameId = `cvk:${g.title}`;
              return (
                <SourceGameCard
                  key={`${g.file}-${index}`}
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
                      image: g.image,
                      source: 'CVK',
                      description: `Play ${g.title} from Chicken King's Vault.`
                    });
                  }}
                  fallbackIcon={Crown}
                  fallbackIconClassName="text-amber-400"
                  hoverBorderClass="hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                />
              );
            })}
            
            {displayedGames.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p>No titles found matching your search.</p>
              </div>
            )}
            
            {visibleCount < filteredGames.length && (
              <div className="col-span-full flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount(c => c + 60)}
                  className="px-6 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  Load More ({filteredGames.length - visibleCount} Remaining)
                </button>
              </div>
            )}
          </div>
        )}
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
                    const gameId = `cvk:${selectedGame.title}`;
                    toggleFavorite({
                      id: gameId,
                      title: selectedGame.title,
                      url: selectedGame.url,
                      image: selectedGame.image,
                      source: 'CVK',
                      description: `Play ${selectedGame.title} from Chicken King's Vault.`
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`cvk:${selectedGame.title}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`cvk:${selectedGame.title}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const el = document.getElementById('cvk-iframe') as HTMLIFrameElement;
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
                id="cvk-iframe"
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
