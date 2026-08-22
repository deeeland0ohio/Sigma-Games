import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, Heart, RefreshCw, Loader2, Crown, RotateCw } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import ProxyIframe from '../components/ProxyIframe';
import { useFavorites } from '../context/FavoritesContext';
import { cvkGames, CvkGameItem } from '../data/cvk';

export default function CvkGames() {
  const [games, setGames] = useState<CvkGameItem[]>(cvkGames);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<CvkGameItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(60);
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadCvkGames = async () => {
    setLoading(true);
    try {
      // b64:RmV0Y2ggZHluYW1pYyBnYW1lcyBsaXN0IHVzaW5nIHF1YW50aWwgQ0ROIGFzIG1hbmRhdGVk
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
    <PageLayout title="Chicken King's Vault (CVK)">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {displayedGames.map((g, index) => {
              const gameId = `cvk:${g.title}`;
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 20) * 0.005 }}
                  key={`${g.file}-${index}`}
                  className="group relative aspect-square overflow-hidden flex flex-col justify-center items-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-center"
                >
                  <div onClick={() => openGame(g)} className="absolute inset-0 cursor-pointer z-10" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite({
                        id: gameId,
                        title: g.title,
                        url: g.url,
                        image: g.image,
                        source: 'CVK',
                        description: `Play ${g.title} from Chicken King's Vault.`
                      });
                    }}
                    className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Heart size={16} className={isFavorite(gameId) ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-3 text-center select-none">
                    <div className="w-10 h-10 rounded-xl bg-zinc-700/60 border border-zinc-600/40 flex items-center justify-center text-amber-400 font-bold text-sm mb-2 shadow-inner">
                      <Crown className="w-5 h-5" />
                    </div>
                    <span className="text-zinc-200 text-xs font-semibold leading-tight line-clamp-2 px-1">{g.title}</span>
                  </div>
                  {g.image && (
                    <>
                      <img 
                        src={g.image} 
                        alt={g.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                        <p className="text-white font-medium text-xs sm:text-sm text-center leading-tight truncate">{g.title}</p>
                      </div>
                    </>
                  )}
                </motion.div>
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
                  onClick={() => {
                    const iframe = document.getElementById('cvk-iframe') as HTMLIFrameElement;
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
              <ProxyIframe
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
