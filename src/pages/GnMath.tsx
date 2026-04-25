import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Search, X, Maximize, Box } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const COVER_BASE = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const HTML_BASE = "https://rawcdn.githack.com/freebuisness/html/main";

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

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json");
      const raw = await res.json();
      
      const parsedZones = raw.slice(1).map((z: any) => ({
        name: z.name,
        cover: z.cover.replace("{COVER_URL}", COVER_BASE),
        url: z.url.replace("{HTML_URL}", HTML_BASE),
        tags: z.special || []
      }));
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

  const openZone = (zone: Zone) => {
    setSelectedZone(zone);
  };

  const filteredZones = zones.filter(z => {
    const matchSearch = z.name.toLowerCase().includes(search.toLowerCase());
    const matchTag = selectedTag ? z.tags.includes(selectedTag) : true;
    return matchSearch && matchTag;
  });

  return (
    <PageLayout title="GN-Math">
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
            className="w-full sm:w-auto px-4 py-3 rounded-lg font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredZones.map((z, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                key={`${z.name}-${index}`}
                onClick={() => openZone(z)}
                className="group relative aspect-square overflow-hidden cursor-pointer rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <img 
                  src={z.cover} 
                  alt={z.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                  <p className="text-white font-medium text-xs sm:text-sm text-center leading-tight truncate">{z.name}</p>
                </div>
              </motion.div>
            ))}
            {filteredZones.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p>No titles found matching your search.</p>
              </div>
            )}
          </div>
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
              <iframe
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
