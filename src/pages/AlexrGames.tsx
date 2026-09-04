import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ContentFrame from '../components/ContentFrame';
import { Loader2, Search, X, Maximize, Box, RefreshCw, RotateCw, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import { alexrGames as initialAlexrGames } from '../data/alexr';
import { useFavorites } from '../context/FavoritesContext';

export interface AlexrGame {
  title: string;
  img: string;
  description: string;
  path: string;
  category: string;
  iframe?: boolean;
}

export default function AlexrGames() {
  const [games, setGames] = useState<AlexrGame[]>(() => {
    // Exclude Code Editor on initial mount if present in backup dataset
    return initialAlexrGames.filter(g => 
      g.title !== "Alexr Code Editor" && 
      g.path !== "https://cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/Apps/codeeditor.html"
    ).map(g => ({
      ...g,
      path: g.path
    }));
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<AlexrGame | null>(null);
  const [visibleCount, setVisibleCount] = useState(100);
  const [reloadKey, setReloadKey] = useState(0);
  
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/singlefilegames.json");
      if (res.ok) {
        const raw = await res.json() as AlexrGame[];
        if (Array.isArray(raw)) {
          // Filter out "Alexr Code Editor" from dynamic data source
          const parsed = raw.filter((g: AlexrGame) => 
            g.title !== "Alexr Code Editor" && 
            g.path !== "https://cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/Apps/codeeditor.html"
          ).map(g => ({
            ...g,
            path: g.path
          }));
          
          // Sort alphabetically (0-9-a-z)
          parsed.sort((a, b) => {
            const titleA = (a.title || "").toLowerCase();
            const titleB = (b.title || "").toLowerCase();
            return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
          });
          
          setGames(parsed);
          const allCats = Array.from(new Set(parsed.map((g: AlexrGame) => g.category).filter(Boolean))) as string[];
          setCategories(allCats);
        }
      }
    } catch (e) {
      console.error("Failed to load Alexr Games index dynamically", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const openGame = (game: AlexrGame) => {
    setSelectedGame(game);
    setReloadKey(0); // Reset reload key upon opening new game
  };

  const filteredGames = games.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) || 
                        g.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? g.category === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <PageLayout title="Alexr Games" maxWidth="wide" showBack={true}>
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Alexr Games</h1>
          <p className="text-zinc-500 mt-2">
            Browse the selection of {games.length > 0 ? games.length : '676'} games from Alexr Games!
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Alexr Games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex flex-row gap-3 w-full sm:w-auto">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
            <button
              onClick={loadGames}
              disabled={loading}
              className="px-4 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center gap-2 justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Display Grid - Matched Exactly to GN-Math */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="game-source-grid">
            {displayedGames.map((g, index) => {
               const gameId = `alexr:${g.title}`;
               return (
                <SourceGameCard
                  key={`${g.title}-${index}`}
                  index={index}
                  title={g.title}
                  image={g.img}
                  onClick={() => openGame(g)}
                  isFavorite={isFavorite(gameId)}
                  onToggleFavorite={() => {
                    toggleFavorite({
                      id: gameId,
                      title: g.title,
                      url: g.path,
                      image: g.img,
                      source: 'Alexr',
                      description: g.description
                    });
                  }}
                  hoverBorderClass="hover:border-zinc-500/50 hover:shadow-[0_0_15px_rgba(113,113,122,0.15)]"
                />
              );
            })}

            {filteredGames.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p>No games found matching your search query.</p>
              </div>
            )}
          </div>
        )}

        {/* Load More Button */}
        {filteredGames.length > visibleCount && (
           <div className="flex justify-center mt-6">
             <button
               onClick={() => setVisibleCount(prev => prev + 100)}
               className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-white font-medium transition-colors"
             >
               Load More ({filteredGames.length - visibleCount} Remaining)
             </button>
           </div>
         )}
      </div>

      {/* Fullscreen Overlay Component */}
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
                  onClick={() => setReloadKey(prev => prev + 1)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Reload Game"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const gameId = `alexr:${selectedGame.title}`;
                    toggleFavorite({
                      id: gameId,
                      title: selectedGame.title,
                      url: selectedGame.path,
                      image: selectedGame.img,
                      source: 'Alexr',
                      description: selectedGame.description
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`alexr:${selectedGame.title}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`alexr:${selectedGame.title}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const btn = document.getElementById('alexr-game-iframe') as HTMLIFrameElement;
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
                id="alexr-game-iframe"
                key={reloadKey}
                reloadKey={reloadKey}
                src={selectedGame.path}
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
