import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Maximize, Box, Heart, RefreshCw } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { seraphGames as initialSeraphGames } from '../data/seraph';
import { useFavorites } from '../context/FavoritesContext';

export default function SeraphGames() {
  const [games, setGames] = useState(initialSeraphGames);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(100);
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.github.com/repos/a456pur/seraph/git/trees/main?recursive=1');
      if (res.ok) {
        const data = await res.json();
        if (data && data.tree) {
          const gameFolders = data.tree
            .filter((node: any) => node.path.startsWith('games/') && node.path.split('/').length === 2 && node.type === 'tree')
            .map((node: any) => {
              const id = node.path.replace('games/', '');
              return { 
                id, 
                image: `https://raw.githubusercontent.com/a456pur/seraph/main/images/thumbnails/${id}.jpg`
              };
            });
          
          if (gameFolders.length > 0) {
            setGames(gameFolders);
          }
        }
      }
    } catch (e) {
      console.error("Failed to update Seraph games list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const formatFileName = (raw: string) => {
    let name = raw.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([0-9])([a-zA-Z])/g, '$1 $2');
    name = name.replace(/[-_.]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return name;
  };

  const openFile = (file: string) => {
    setSelectedFile(file);
  };

  const getUrl = (file: string) => {
    return `https://raw.githack.com/a456pur/seraph/main/games/${file}/index.html`;
  };

  const filteredFiles = games.filter(f => f.id.toLowerCase().includes(search.toLowerCase()));
  const displayedFiles = filteredFiles.slice(0, visibleCount);

  return (
    <PageLayout title="Seraph Games">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Seraph collection..."
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayedFiles.map((f, index) => {
            const displayName = formatFileName(f.id);
            const gameId = `seraph:${displayName}`;
            
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index % 50) * 0.01 }}
                key={`${f.id}-${index}`}
                className="group relative aspect-square overflow-hidden flex flex-col justify-center items-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-center"
              >
                <div onClick={() => openFile(f.id)} className="absolute inset-0 cursor-pointer z-10" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite({
                      id: gameId,
                      title: displayName || f.id,
                      url: getUrl(f.id),
                      image: f.image || '',
                      source: 'Seraph',
                      description: `Play ${displayName || f.id} from Seraph.`
                    });
                  }}
                  className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Heart size={16} className={isFavorite(gameId) ? 'fill-red-500 text-red-500' : ''} />
                </button>
                {f.image ? (
                  <>
                    <img 
                      src={f.image} 
                      alt={displayName} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                      <p className="text-white font-medium text-xs sm:text-sm text-center leading-tight truncate">{displayName || f.id}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center p-4 hover:bg-zinc-800/50">
                    <p className="text-white font-medium text-sm break-all line-clamp-3 group-hover:text-zinc-300">
                      {displayName || f.id}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
          
          {displayedFiles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
              <Box className="w-12 h-12 mb-4 opacity-20" />
              <p>No titles found matching your search.</p>
            </div>
          )}
          
          {visibleCount < filteredFiles.length && (
            <div className="col-span-full flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount(c => c + 150)}
                className="px-6 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                Load More ({filteredFiles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Player Overlay */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <h3 className="text-white font-medium pl-2 truncate flex-1">{formatFileName(selectedFile)}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const displayName = formatFileName(selectedFile);
                    const gameId = `seraph:${displayName}`;
                    const f = games.find(g => g.id === selectedFile);
                    toggleFavorite({
                      id: gameId,
                      title: displayName || selectedFile,
                      url: getUrl(selectedFile),
                      image: f?.image || '',
                      source: 'Seraph',
                      description: `Play ${displayName || selectedFile} from Seraph.`
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`seraph:${formatFileName(selectedFile)}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`seraph:${formatFileName(selectedFile)}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const btn = document.getElementById('seraph-iframe') as HTMLIFrameElement;
                     if (btn) btn.requestFullscreen?.();
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full bg-black relative">
              <iframe
                id="seraph-iframe"
                src={getUrl(selectedFile)}
                className="w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; pointer-lock; keyboard-map"
                allowFullScreen
                title={selectedFile}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
