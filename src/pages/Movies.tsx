import { useState, useEffect, useRef } from 'react';
import PageLayout from '../components/PageLayout';
import { useThemeColors } from '../context/ThemeContext';
import { Play, Film, Tv, Search, Loader2, Maximize, X, AlertTriangle } from 'lucide-react';

export default function Movies() {
  const colors = useThemeColors();
  const [type, setType] = useState<typeof window.location.hash extends '#tv' ? 'tv' : 'movie'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showWarning, setShowWarning] = useState(true);

  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [embedUrl, setEmbedUrl] = useState('');

  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResults();
  }, [type]);

  const fetchResults = async (query?: string) => {
    setIsLoading(true);
    setError('');
    setResults([]);
    try {
      const isSearch = query && query.trim().length > 0;
      const API_KEY = 'f1e91ad0cfd485271785971f8117ec74';
      const BASE_URL = 'https://api.themoviedb.org/3';
      let url = '';
      if (type === 'movie') {
        url = isSearch 
          ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query!)}&page=1`
          : `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&page=1`;
      } else {
        url = isSearch 
          ? `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query!)}&page=1`
          : `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=1`;
      }

      // Try fetching via direct API first
      let response = await fetch(url);
      
      if (!response.ok) {
         throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Handle various response shapes commonly used by TMDB wrappers
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.results && Array.isArray(data.results)) {
        items = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      }
      
      setResults(items);
    } catch (err: any) {
      console.error("API error:", err);
      // Fallback: If CORS or 403 fails, maybe the API structure is slightly different.
      // But we will show the error for debugging for the user
      setError("We are having trouble contacting the database API. You can still manually enter an ID below.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(searchQuery);
    setSelectedMedia(null);
    setEmbedUrl('');
  };

  const getImageUrl = (item: any) => {
    if (item.poster_path) return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    if (item.poster) return item.poster;
    return 'https://via.placeholder.com/500x750/111/555?text=No+Poster';
  };

  const getTitle = (item: any) => {
    return item.title || item.name || item.original_title || item.original_name || 'Unknown Title';
  };

  const getId = (item: any) => {
    return item.imdb_id || item.tmdb_id || item.id;
  };

  const playMedia = (item: any) => {
    setSelectedMedia(item);
    const id = getId(item);

    if (type === 'tv') {
        setSeason('1');
        setEpisode('1');
        updateEmbedUrl(id, 'tv', '1', '1');
    } else {
        updateEmbedUrl(id, 'movie', '1', '1');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const updateEmbedUrl = (id: string, mediaType: 'movie' | 'tv', s: string, e: string) => {
      if (mediaType === 'movie') {
        setEmbedUrl(`https://movies.niketeam.workers.dev/embed/${id}`);
      } else {
        setEmbedUrl(`https://movies.niketeam.workers.dev/embedtv/${id}&s=${s}&e=${e}`);
      }
  };

  const handleManualWatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('mediaId') as string;
    if (!id) return;

    setSelectedMedia({
       isManual: true,
       title: `Manual ID: ${id}`,
       id: id
    });

    if (type === 'movie') {
      updateEmbedUrl(id, 'movie', '1', '1');
    } else {
      const formSeason = formData.get('season') as string || '1';
      const formEpisode = formData.get('episode') as string || '1';
      setSeason(formSeason);
      setEpisode(formEpisode);
      updateEmbedUrl(id, 'tv', formSeason, formEpisode);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageLayout title="Movies & TV" showBack>
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${colors.primaryBg}`}></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className={colors.secondary} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Experimental Feature</h3>
                <p className="text-sm text-zinc-400">
                  These might not work. They are experimental and depend on external streaming services.
                </p>
              </div>
              <button 
                onClick={() => setShowWarning(false)}
                className={`mt-4 w-full py-3 px-6 rounded-xl font-bold text-white ${colors.primaryBg} hover:opacity-90 transition-opacity`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-full sm:w-fit">
              <button
                type="button"
                onClick={() => { setType('movie'); setSelectedMedia(null); setEmbedUrl(''); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md transition-colors text-sm font-bold ${
                  type === 'movie' 
                    ? `${colors.primaryBg} text-white shadow-md` 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Film size={18} /> Movies
              </button>
              <button
                type="button"
                onClick={() => { setType('tv'); setSelectedMedia(null); setEmbedUrl(''); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md transition-colors text-sm font-bold ${
                  type === 'tv' 
                    ? `${colors.primaryBg} text-white shadow-md` 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Tv size={18} /> TV Shows
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder={`Search ${type === 'movie' ? 'movies' : 'TV shows'}...`}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all font-medium"
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </form>
        </div>

        {selectedMedia && embedUrl && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white px-1">
                   {selectedMedia.isManual ? selectedMedia.title : getTitle(selectedMedia)}
                </h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setSelectedMedia(null); setEmbedUrl(''); }}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
                  >
                      <X size={16} /> Close Player
                  </button>
                </div>
            </div>
            
            <div ref={playerRef} className="rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video relative shadow-2xl group/player">
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full bg-black"
                frameBorder="0"
                allowFullScreen
                title="Media Player"
              ></iframe>
              <button
                onClick={() => {
                  if (playerRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      playerRef.current.requestFullscreen();
                    }
                  }
                }}
                className="absolute bottom-4 right-4 p-2 bg-black/60 rounded-full text-white/50 hover:text-white/100 hover:bg-black/90 transition-all opacity-0 group-hover/player:opacity-100 z-50 player-fullscreen-btn"
                title="Fullscreen"
              >
                <Maximize size={20} />
              </button>
            </div>

            {type === 'tv' && (
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Season</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={season}
                            onChange={e => {
                                setSeason(e.target.value);
                                if (selectedMedia && !selectedMedia.isManual) {
                                    updateEmbedUrl(getId(selectedMedia), 'tv', e.target.value, episode);
                                }
                            }}
                            className="w-24 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-bold max-w-[100px]" 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Episode</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={episode}
                            onChange={e => {
                                setEpisode(e.target.value);
                                if (selectedMedia && !selectedMedia.isManual) {
                                    updateEmbedUrl(getId(selectedMedia), 'tv', season, e.target.value);
                                }
                            }}
                            className="w-24 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-bold max-w-[100px]" 
                          />
                      </div>
                  </div>
              </div>
            )}
          </div>
        )}

        {!selectedMedia && (
            <>
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-white mb-6">
                            {searchQuery ? `Search Results for "${searchQuery}"` : `Trending ${type === 'movie' ? 'Movies' : 'TV Shows'}`}
                        </h3>
                        
                        {error && (
                            <div className="p-6 bg-zinc-900 border border-red-900/50 rounded-xl mb-8">
                                <p className="text-red-400 mb-4">{error}</p>
                                <form onSubmit={handleManualWatch} className="space-y-4">
                                    <h4 className="font-bold text-white">Manual Entry Fallback</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-1">
                                            <input name="mediaId" type="text" placeholder="IMDb/TMDB ID (e.g. tt1234567)" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white" required />
                                        </div>
                                        {type === 'tv' && (
                                            <>
                                                <div className="sm:col-span-1"><input name="season" type="number" min="1" defaultValue="1" placeholder="Season" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white" /></div>
                                                <div className="sm:col-span-1"><input name="episode" type="number" min="1" defaultValue="1" placeholder="Episode" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white" /></div>
                                            </>
                                        )}
                                    </div>
                                    <button type="submit" className={`px-6 py-2 ${colors.primaryBg} text-white rounded-lg font-bold`}>Watch Now</button>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {results.map((item, i) => (
                                <button 
                                  key={`${getId(item)}-${i}`}
                                  onClick={() => playMedia(item)}
                                  className="group flex flex-col text-left space-y-3 cursor-pointer outline-none focus:ring-2 focus:ring-white/20 rounded-xl rounded-b-none"
                                >
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 shadow-xl border border-zinc-800/50 group-hover:border-zinc-500 transition-colors">
                                        <img 
                                          src={getImageUrl(item)} 
                                          alt={getTitle(item)}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <div className={`w-14 h-14 rounded-full ${colors.primaryBg} flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl`}>
                                                <Play size={24} fill="currentColor" className="text-white ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-200 line-clamp-1 group-hover:text-white">{getTitle(item)}</h4>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : ''}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {!error && results.length === 0 && !isLoading && (
                            <div className="text-center py-20 text-zinc-500">
                                No {type === 'movie' ? 'movies' : 'TV shows'} found.
                            </div>
                        )}
                    </>
                )}
            </>
        )}
      </div>
    </PageLayout>
  );
}

