import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ContentFrame from '../components/ContentFrame';
import { Search, X, Maximize, Box, RefreshCw, Loader2, RotateCw, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import { seraphGames as initialSeraphGames } from '../data/seraph';
import { useFavorites } from '../context/FavoritesContext';

export default function SeraphGames() {
  const [games, setGames] = useState(initialSeraphGames);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
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
                image: `https://cdn.jsdelivr.net/gh/a456pur/seraph@main/images/thumbnails/${id}.jpg`
              };
            });
          
          if (gameFolders.length > 0) {
            // Sort alphabetically (0-9-a-z) by formatted title
            gameFolders.sort((a: any, b: any) => {
              const nameA = formatFileName(a.id).toLowerCase();
              const nameB = formatFileName(b.id).toLowerCase();
              return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
            });
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
    return `https://cdn.jsdelivr.net/gh/a456pur/seraph@main/games/${file}/index.html`;
  };

  const filteredFiles = games.filter(f => f.id.toLowerCase().includes(search.toLowerCase()));
  const displayedFiles = filteredFiles.slice(0, visibleCount);

  return (
    <PageLayout title="Seraph Games" maxWidth="wide" showBack={true}>
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="game-source-grid">
            {displayedFiles.map((f, index) => {
              const displayName = formatFileName(f.id);
              const gameId = `seraph:${displayName}`;
              
              return (
                <SourceGameCard
                  key={`${f.id}-${index}`}
                  index={index}
                  title={displayName || f.id}
                  image={f.image || null}
                  onClick={() => openFile(f.id)}
                  isFavorite={isFavorite(gameId)}
                  onToggleFavorite={() => {
                    toggleFavorite({
                      id: gameId,
                      title: displayName || f.id,
                      url: getUrl(f.id),
                      image: f.image || '',
                      source: 'Seraph',
                      description: `Play ${displayName || f.id} from Seraph.`
                    });
                  }}
                  hoverBorderClass="hover:border-zinc-500/50 hover:shadow-[0_0_15px_rgba(113,113,122,0.15)]"
                />
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
                  onClick={() => setVisibleCount(c => c + 100)}
                  className="px-6 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  Load More ({filteredFiles.length - visibleCount} Remaining)
                </button>
              </div>
            )}
          </div>
        )}
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
                  onClick={() => setReloadKey(k => k + 1)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reload Game"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
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
              <ContentFrame
                key={reloadKey}
                reloadKey={reloadKey}
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
