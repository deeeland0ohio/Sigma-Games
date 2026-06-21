import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, Heart, Loader2, RefreshCw } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { noahGames as initialNoahGames } from '../data/noah';
import { useFavorites } from '../context/FavoritesContext';

export default function NoahGames() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<{ url: string, title: string, desc: string, image: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(100);
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://cdn.githuback.com/deeeland0ohio/Noahs-Hub-Games-js@main/games.js').catch(() => fetch('https://cdn.jsdelivr.net/gh/deeeland0ohio/Noahs-Hub-Games-js@main/games.js'));
      const text = await res.text();
      const fnText = text.replace(/const games\s*=/, "return");
      const gamesArray = (new Function(fnText))();
      if (Array.isArray(gamesArray) && gamesArray.length > 0) {
        const sorted = [...gamesArray].sort((a, b) => 
          (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' })
        );
        setGames(sorted);
      } else {
        throw new Error("Invalid games array format");
      }
    } catch (e) {
      console.error("Failed to fetch Noah games from CDN, falling back to local list:", e);
      const sorted = [...initialNoahGames].sort((a, b) => 
        (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' })
      );
      setGames(sorted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const formatFileName = (raw: string) => {
    if (!raw) return '';
    let name = raw.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([0-9])([a-zA-Z])/g, '$1 $2');
    name = name.replace(/[-_.]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return name;
  };

  const openGame = (game: any) => {
    setSelectedGame(game);
  };

  const filteredGames = games.filter(g => 
    (g.title || g.url).toLowerCase().includes(search.toLowerCase())
  );
  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <PageLayout title="Noah's Hub Games">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Noah's collection..."
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
              const displayName = g.title || formatFileName(g.url.split('/').pop() || g.url);
              const imageSrc = g.image || null;
              const gameId = `noah:${displayName}`;
              
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
                        title: displayName,
                        url: g.url.replace('/refs/heads/master/', '/master/').replace('raw.githubusercontent.com', 'raw.githack.com'),
                        image: imageSrc || '',
                        source: "Noah's Hub",
                        description: g.desc
                      });
                    }}
                    className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Heart size={16} className={isFavorite(gameId) ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                  {imageSrc ? (
                    <>
                      <img 
                        src={imageSrc} 
                        alt={displayName} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                        <p className="text-white font-medium text-xs sm:text-sm text-center leading-tight truncate">{displayName}</p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center p-4 hover:bg-zinc-800/50">
                      <p className="text-white font-medium text-sm break-all line-clamp-3 group-hover:text-zinc-300">
                        {displayName}
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
              <h3 className="text-white font-medium pl-2 truncate flex-1">{selectedGame.title || formatFileName(selectedGame.url)}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const displayName = selectedGame.title || formatFileName(selectedGame.url.split('/').pop() || selectedGame.url);
                    const gameId = `noah:${displayName}`;
                    toggleFavorite({
                      id: gameId,
                      title: displayName,
                      url: selectedGame.url.replace('/refs/heads/master/', '/master/').replace('raw.githubusercontent.com', 'raw.githack.com'),
                      image: selectedGame.image || '',
                      source: "Noah's Hub",
                      description: selectedGame.desc
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`noah:${selectedGame.title || formatFileName(selectedGame.url.split('/').pop() || selectedGame.url)}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`noah:${selectedGame.title || formatFileName(selectedGame.url.split('/').pop() || selectedGame.url)}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const btn = document.getElementById('noah-iframe') as HTMLIFrameElement;
                     if (btn) btn.requestFullscreen?.();
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
                id="noah-iframe"
                src={selectedGame.url.replace('/refs/heads/master/', '/master/').replace('raw.githubusercontent.com', 'raw.githack.com')}
                className="w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; pointer-lock; keyboard-map"
                allowFullScreen
                title={selectedGame.title || selectedGame.url}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
