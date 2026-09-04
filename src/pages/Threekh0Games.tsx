import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ContentFrame from '../components/ContentFrame';
import { Search, X, Maximize, Box, RefreshCw, Loader2, RotateCw, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import { threekh0Games as initialThreekh0Games } from '../data/3kh0';
import { useFavorites } from '../context/FavoritesContext';

export default function Threekh0Games() {
  const [games, setGames] = useState(initialThreekh0Games);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<{ link: string, title?: string, imgSrc?: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(100);
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.github.com/repos/3kh0/3kh0-lite/git/trees/main?recursive=1');
      if (res.ok) {
        const data = await res.json();
        if (data && data.tree) {
          const gameFolders = data.tree
            .filter((node: any) => node.path.startsWith('projects/') && node.path.split('/').length === 2 && node.type === 'tree')
            .map((node: any) => {
              const id = node.path.replace('projects/', '');
              // Try to find an image in the tree for this project
              const imageNode = data.tree.find((n: any) => 
                n.path.startsWith(`projects/${id}/`) && 
                (n.path.endsWith('.png') || n.path.endsWith('.jpg'))
              );
              
              return { 
                link: `projects/${id}/index.html`,
                imgSrc: imageNode ? imageNode.path : `projects/${id}/meta/apple-touch-icon.png`,
                title: id.replace(/-/g, ' ')
              };
            });
          
          if (gameFolders.length > 0) {
            // Sort alphabetically (0-9-a-z) by formatted title
            gameFolders.sort((a: any, b: any) => {
              const nameA = formatFileName(a.title || "").toLowerCase();
              const nameB = formatFileName(b.title || "").toLowerCase();
              return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
            });
            setGames(gameFolders);
          }
        }
      }
    } catch (e) {
      console.error("Failed to update 3kh0 games list", e);
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

  const openGame = (game: { link: string, title?: string }) => {
    setSelectedGame(game);
  };

  const getUrl = (link: string) => {
    return `https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/${link}`;
  };

  const filteredGames = games.filter(g => 
    (g.title || g.link).toLowerCase().includes(search.toLowerCase())
  );
  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <PageLayout title="3kh0 Games" maxWidth="wide" showBack={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search 3kh0 collection..."
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
            {displayedGames.map((g, index) => {
              const displayName = g.title || formatFileName(g.link.split('/')[1] || g.link);
              const imageSrc = g.imgSrc ? `https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/${g.imgSrc}` : null;
              const gameId = `3kh0:${displayName}`;
              
              return (
                <SourceGameCard
                  key={`${g.link}-${index}`}
                  index={index}
                  title={displayName}
                  image={imageSrc}
                  onClick={() => openGame(g)}
                  isFavorite={isFavorite(gameId)}
                  onToggleFavorite={() => {
                    toggleFavorite({
                      id: gameId,
                      title: displayName,
                      url: getUrl(g.link),
                      image: imageSrc || '',
                      source: '3kh0',
                      description: `Play ${displayName} from 3kh0.`
                    });
                  }}
                  hoverBorderClass="hover:border-zinc-500/50 hover:shadow-[0_0_15px_rgba(113,113,122,0.15)]"
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
              <h3 className="text-white font-medium pl-2 truncate flex-1">{selectedGame.title || formatFileName(selectedGame.link)}</h3>
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
                    const displayName = selectedGame.title || formatFileName(selectedGame.link.split('/')[1] || selectedGame.link);
                    const gameId = `3kh0:${displayName}`;
                    const imageSrc = (selectedGame as any).imgSrc ? `https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/${(selectedGame as any).imgSrc}` : null;
                    toggleFavorite({
                      id: gameId,
                      title: displayName,
                      url: getUrl(selectedGame.link),
                      image: imageSrc || '',
                      source: '3kh0',
                      description: `Play ${displayName} from 3kh0.`
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`3kh0:${selectedGame.title || formatFileName(selectedGame.link.split('/')[1] || selectedGame.link)}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`3kh0:${selectedGame.title || formatFileName(selectedGame.link.split('/')[1] || selectedGame.link)}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const btn = document.getElementById('threekh0-iframe') as HTMLIFrameElement;
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
              <ContentFrame
                key={reloadKey}
                reloadKey={reloadKey}
                id="threekh0-iframe"
                src={getUrl(selectedGame.link)}
                className="w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; pointer-lock; keyboard-map"
                allowFullScreen
                title={selectedGame.title || selectedGame.link}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
