import ContentFrame from '../components/ContentFrame';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Search, X, Maximize, Box, Heart, RefreshCw, RotateCw } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SourceGameCard from '../components/SourceGameCard';
import { useFavorites } from '../context/FavoritesContext';

export default function UgsFiles() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(100);
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js");
      const text = await res.text();
      
      const match = text.match(/let files = \[(.*?)\];/s);
      if (match) {
        const arrayText = `[${match[1]}]`;
        const stringMatches = [...arrayText.matchAll(/"([^"]+)"|'([^']+)'/g)];
        const parsedFiles = stringMatches.map(m => m[1] || m[2]).filter(f => f !== '?');
        
        // Sort alphabetically (0-9-a-z) by their formatted names
        parsedFiles.sort((a, b) => {
          const nameA = formatFileName(a).toLowerCase();
          const nameB = formatFileName(b).toLowerCase();
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        setFiles(parsedFiles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const formatFileName = (raw: string) => {
    let name = raw.replace(/^cl/i, '');
    name = name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([0-9])([a-zA-Z])/g, '$1 $2');
    name = name.replace(/[-_.]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return name;
  };

  const openFile = (file: string) => {
    setSelectedFile(file);
  };

  const getUrl = (file: string) => {
    const normalizeFileName = (name: string) => {
      if (name.includes(".") && name.lastIndexOf(".") > 0) return name;
      return name + ".html";
    };
    const normalized = normalizeFileName(file);
    return `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/UGS-Files/${encodeURIComponent(normalized)}`;
  };

  const filteredFiles = files.filter(f => f.toLowerCase().includes(search.toLowerCase()));
  const displayedFiles = filteredFiles.slice(0, visibleCount);

  return (
    <PageLayout title="UGS Games" maxWidth="wide" showBack={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Ultimate Game Stash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
            />
          </div>
          
          <button
            onClick={loadFiles}
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
          <div className="game-source-grid">
            {displayedFiles.map((f, index) => {
              const displayName = formatFileName(f);
              const gameId = `ugs:${displayName}`;
              
              return (
                <SourceGameCard
                  key={`${f}-${index}`}
                  index={index}
                  title={displayName || f}
                  image={null}
                  onClick={() => openFile(f)}
                  isFavorite={isFavorite(gameId)}
                  onToggleFavorite={() => {
                    toggleFavorite({
                      id: gameId,
                      title: displayName || f,
                      url: getUrl(f),
                      source: 'UGS',
                      description: `Play ${displayName || f} from UGS.`
                    });
                  }}
                  fallbackIcon={Box}
                  fallbackIconClassName="text-blue-400"
                  hoverBorderClass="hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
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
              <h3 className="text-white font-medium pl-2 truncate flex-1">{selectedFile.replace(/^cl/i, '')}</h3>
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
                    const gameId = `ugs:${displayName}`;
                    toggleFavorite({
                      id: gameId,
                      title: displayName || selectedFile,
                      url: getUrl(selectedFile),
                      source: 'UGS',
                      description: `Play ${displayName || selectedFile} from UGS.`
                    });
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isFavorite(`ugs:${formatFileName(selectedFile)}`) ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(`ugs:${formatFileName(selectedFile)}`) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                     const btn = document.getElementById('ugs-iframe') as HTMLIFrameElement;
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
                id="ugs-iframe"
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
