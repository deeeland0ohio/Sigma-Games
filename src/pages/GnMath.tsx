import ContentFrame from '../components/ContentFrame';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Search, X, Maximize, Box, RefreshCw, RotateCw, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import { useFavorites } from '../context/FavoritesContext';

const COVER_BASE = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const HTML_BASE = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";

export interface Zone {
  name: string;
  cover: string;
  url: string;
  tags: string[];
}

export default function GnMath() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(100);
  
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json");
      const raw = await res.json();
      
      const parsedZones = raw
        .filter((z: any) => {
          if (!z || !z.name || !z.url) return false;
          const name = z.name.trim().toLowerCase();
          const url = z.url.trim().toLowerCase();
          if (name.startsWith('[!]') || name.includes('[!]') || name.startsWith('[?]')) return false;
          if (name.includes('comment') || name.includes('discord') || name.includes('suggest game') || name.includes('suggest a game')) return false;
          if (url.includes('discord.gg') || url.includes('forms.gle') || url.includes('docs.google.com/forms')) return false;
          return true;
        })
        .map((z: any) => ({
          name: z.name,
          cover: z.cover ? z.cover.replace("{COVER_URL}", COVER_BASE) : '',
          url: z.url.replace("{HTML_URL}", HTML_BASE),
          tags: z.special || []
        }));
      
      // Sort alphabetically (0-9-a-z)
      parsedZones.sort((a: any, b: any) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      setZones(parsedZones);
      const allTags = Array.from(new Set(parsedZones.flatMap((z: Zone) => z.tags))) as string[];
      setTags(allTags);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    setVisibleCount(100);
  }, [search, selectedTag]);

  const openZone = (zone: Zone) => {
    setSelectedZone(zone);
  };

  const filteredZones = zones.filter(z => {
    const matchSearch = z.name.toLowerCase().includes(search.toLowerCase());
    const matchTag = selectedTag ? z.tags.includes(selectedTag) : true;
    return matchSearch && matchTag;
  });

  const displayedZones = filteredZones.slice(0, visibleCount);

  return (
    <PageLayout title="GN-Math" maxWidth="wide" showBack={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search collection..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
            />
          </div>
          
          <select 
            value={selectedTag} 
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all min-w-[150px]"
          >
            <option value="">All Tags</option>
            {tags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          
          <button
            onClick={loadZones}
            className="w-full sm:w-auto px-4 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center justify-center gap-2"
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
          <>
            <div className="game-source-grid">
              {displayedZones.map((z, index) => {
                const gameId = `gnmath:${z.name}`;
                return (
                  <SourceGameCard
                    key={`${z.name}-${index}`}
                    index={index}
                    title={z.name}
                    image={z.cover}
                    onClick={() => openZone(z)}
                    isFavorite={isFavorite(gameId)}
                    onToggleFavorite={() => {
                      toggleFavorite({
                        id: gameId,
                        title: z.name,
                        url: z.url,
                        image: z.cover,
                        source: 'gn-math'
                      });
                    }}
                    hoverBorderClass="hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  />
                );
              })}
            </div>
              
            {visibleCount < filteredZones.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount(c => c + 100)}
                  className="px-6 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 cursor-pointer"
                >
                  Load More ({filteredZones.length - visibleCount} Remaining)
                </button>
              </div>
            )}

            {filteredZones.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p>No titles found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Player Overlay */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <h3 className="text-white font-medium pl-2 truncate flex-1">{selectedZone.name}</h3>
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
                    const gameId = `gnmath:${selectedZone.name}`;
                    toggleFavorite({
                      id: gameId,
                      title: selectedZone.name,
                      url: selectedZone.url,
                      image: selectedZone.cover,
                      source: 'gn-math'
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`gnmath:${selectedZone.name}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`gnmath:${selectedZone.name}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const btn = document.getElementById('game-iframe') as HTMLIFrameElement;
                     if (btn) btn.requestFullscreen?.();
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedZone(null)}
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
                id="game-iframe"
                src={selectedZone.url}
                className="w-full h-full border-none bg-black"
                allow="autoplay; fullscreen; pointer-lock; keyboard-map"
                allowFullScreen
                title={selectedZone.name}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
