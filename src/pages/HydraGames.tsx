import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, Heart, RefreshCw, Loader2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useFavorites } from '../context/FavoritesContext';

interface HydraGame {
  title: string;
  url: string;
  image?: string;
}

export default function HydraGames() {
  const [games, setGames] = useState<HydraGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<HydraGame | null>(null);
  const [visibleCount, setVisibleCount] = useState(100);
  const { toggleFavorite, isFavorite } = useFavorites();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://raw.githubusercontent.com/zennedu/hydra/main/gmes.json');
      if (!res.ok) throw new Error("GitHub fetch failed: " + res.status);
      const raw = await res.json();
      if (Array.isArray(raw)) {
        const mapped: HydraGame[] = raw.map((g: any) => {
          const title = g.title || "Untitled Game";
          
          let gameUrl = '';
          if (g.file_name) {
            let path = g.file_name;
            if (!path.startsWith('gmes/')) {
              path = 'gmes/' + path;
            }
            gameUrl = `https://cdn.jsdelivr.net/gh/zennedu/hydra@main/${path}`;
          }

          let imageUrl = '';
          if (g.thumb) {
            let path = g.thumb;
            if (!path.startsWith('thumbs/')) {
              path = 'thumbs/' + path;
            }
            imageUrl = `https://cdn.jsdelivr.net/gh/zennedu/hydra@main/${path}`;
          }

          return {
            title,
            url: gameUrl,
            image: imageUrl
          };
        }).filter(g => g.url);

        setGames(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch Hydra games", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGame && iframeRef.current) {
      const iframe = iframeRef.current;
      const targetUrl = selectedGame.url;

      const loadIframeContent = async () => {
        try {
          const response = await fetch(targetUrl);
          if (response.ok) {
            let html = await response.text();
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            const baseTag = `<base href="${baseUrl}">`;
            
            if (!html.includes('<base ')) {
              if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>${baseTag}`);
              } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html><head>${baseTag}</head>`);
              } else {
                html = baseTag + html;
              }
            }
            
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
              doc.open();
              doc.write(html);
              doc.close();
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch game content for inline iframe, falling back to direct src:", err);
        }
        
        // Fallback: set src directly if fetch fails
        iframe.src = targetUrl;
      };

      loadIframeContent();
    }
  }, [selectedGame]);

  const openGame = (game: HydraGame) => {
    setSelectedGame(game);
  };

  const filteredGames = games.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase())
  );
  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <PageLayout title="Hydra Games">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Hydra collection..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={loadGames}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {displayedGames.map((g, index) => {
              const gameId = `hydra:${g.title}`;
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 20) * 0.005 }}
                  key={`${g.url}-${index}`}
                  className="group relative aspect-square overflow-hidden flex flex-col justify-center items-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-center"
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
                        source: 'hydra',
                        description: `Play ${g.title} from Hydra Games.`
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
                    <div className="h-full w-full flex items-center justify-center p-4 hover:bg-zinc-800/50">
                      <p className="text-white font-medium text-sm break-all line-clamp-3 group-hover:text-zinc-300">
                        {g.title}
                      </p>
                    </div>
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
                  onClick={() => setVisibleCount(c => c + 100)}
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
                    const gameId = `hydra:${selectedGame.title}`;
                    toggleFavorite({
                      id: gameId,
                      title: selectedGame.title,
                      url: selectedGame.url,
                      image: selectedGame.image || '',
                      source: 'hydra',
                      description: `Play ${selectedGame.title} from Hydra Games.`
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`hydra:${selectedGame.title}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`hydra:${selectedGame.title}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const iframe = document.getElementById('hydra-iframe') as HTMLIFrameElement;
                     if (iframe) iframe.requestFullscreen?.();
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
              <iframe
                id="hydra-iframe"
                ref={iframeRef}
                className="w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; pointer-lock; keyboard-map"
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
