import { useState, useEffect, useRef } from 'react';
import PageLayout from '../components/PageLayout';
import { useThemeColors } from '../context/ThemeContext';
import ProxyIframe from '../components/ProxyIframe';
import { Play, Youtube, Search, Loader2, Maximize, X, Video, Smartphone, Music, Tv } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  views: string;
  channel: string;
  uploadedAgo?: string;
  isTikTok?: boolean;
  username?: string;
  isShort?: boolean;
}

function formatTimeAgoClient(dateInput: any): string {
  if (!dateInput) return "";
  let date: Date;
  if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    const cleaned = String(dateInput).replace(/^(Streamed live on|Premiered on|Premiered)\s+/i, "").trim();
    date = new Date(cleaned);
  }

  if (isNaN(date.getTime())) {
    if (typeof dateInput === "string" && dateInput.toLowerCase().includes("ago")) return dateInput;
    return String(dateInput);
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0 || seconds < 60) return "Just now";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  
  const months = Math.floor(days / 30.4375);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  
  const years = Math.floor(days / 365.25);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function TikTokEmbed({ videoId }: { videoId: string; username?: string }) {
  return (
    <div className="w-full flex justify-center bg-zinc-950/80 p-4 rounded-2xl border border-zinc-900 overflow-hidden">
      <div 
        className="relative overflow-hidden rounded-2xl bg-black shadow-2xl"
        style={{
          width: '325px',
          height: '580px',
        }}
      >
        <ProxyIframe
          src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1`}
          className="absolute inset-0 w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          title="TikTok Player"
        />
      </div>
    </div>
  );
}

export default function Entertainment() {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'youtube' | 'tiktok'>('youtube');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isPortraitPlayer, setIsPortraitPlayer] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef(activeTab);

  // b64:S2VlcCB0aGUgcmVmIGluIHN5bmMgd2l0aCB0aGUgc3RhdGU=
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // b64:VHJpZ2dlciByZXN1bHRzIGZldGNoIG9uIGFjdGl2ZSB0YWIgY2hhbmdl
  useEffect(() => {
    setSearchQuery('');
    setSelectedMedia(null);
    setEmbedUrl('');
    fetchResults('', 1, activeTab);
  }, [activeTab]);

  const extractTikTokId = (url: string): { id: string; username: string } | null => {
    let decoded = url;
    try {
      decoded = decodeURIComponent(url);
      const tiktokIndex = decoded.search(/tiktok\.com/i);
      if (tiktokIndex !== -1) {
        decoded = decoded.substring(tiktokIndex);
      }
    } catch (e) {}

    // b64:TWF0Y2g6IHRpa3Rvay5jb20vQHVzZXJuYW1lL3ZpZGVvLzEyMzQ1Njc4OTA=
    const match1 = decoded.match(/tiktok\.com\/@([^\/]+)\/video\/(\d+)/i);
    if (match1) {
      return { username: match1[1], id: match1[2] };
    }

    // b64:TWF0Y2g6IHRpa3Rvay5jb20vdi8xMjM0NTY3ODkwIG9yIHRpa3Rvay5jb20vZW1iZWQvMTIzNDU2Nzg5MA==
    const match2 = decoded.match(/tiktok\.com\/(?:v|embed|embed\/v2)\/(\d+)/i);
    if (match2) {
      return { username: '', id: match2[1] };
    }

    // b64:R2VuZXJhbCBkaWdpdHMgYXQgdGhlIGVuZA==
    const match3 = decoded.match(/tiktok\.com\/.*\/(\d+)/i);
    if (match3) {
      return { username: '', id: match3[1] };
    }

    // b64:SXMgaXQganVzdCBhIG51bWVyaWMgc3RyaW5nIG9mIGRpZ2l0cyAocHJlc3VtYWJseSBhIGRpcmVjdCB2aWRlbyBJRCk/
    if (/^\d+$/.test(url.trim())) {
      return { username: '', id: url.trim() };
    }

    return null;
  };

  const extractYouTubeId = (input: string): { id: string | null; isShort: boolean } => {
    const trimmed = input.trim();
    let isShort = trimmed.toLowerCase().includes('/shorts/') || trimmed.toLowerCase().includes('shorts=1');

    // b64:MS4gSWYgaXQncyBhIHB1cmUgMTEgY2hhcmFjdGVyIElE
    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
      return { id: trimmed, isShort };
    }

    try {
      // b64:QWRkIHNlY3VyZSBwcm90b2NvbCBzbyBhYnNvbHV0ZSBVUkwgcGFyc2luZyB3b3Jrcw==
      const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(urlString);

      // b64:eW91dHUuYmUvVklERU9fSUQ=
      if (url.hostname.includes('youtu.be')) {
        const id = url.pathname.substring(1).split('&')[0].split('?')[0].split('#')[0].split('/')[0];
        return { id: id || null, isShort };
      }

      // b64:eW91dHViZS5jb20vc2hvcnRzL1ZJREVPX0lE
      if (url.pathname.includes('/shorts/')) {
        const parts = url.pathname.split('/shorts/');
        if (parts[1]) {
          const id = parts[1].split('/')[0].split('&')[0].split('?')[0].split('#')[0];
          return { id: id || null, isShort: true };
        }
      }

      // b64:eW91dHViZS5jb20vZW1iZWQvVklERU9fSUQgb3IgeW91dHViZS1ub2Nvb2tpZS5jb20vZW1iZWQvVklERU9fSUQ=
      if (url.pathname.includes('/embed/')) {
        const parts = url.pathname.split('/embed/');
        if (parts[1]) {
          const id = parts[1].split('/')[0].split('&')[0].split('?')[0].split('#')[0];
          return { id: id || null, isShort };
        }
      }

      // b64:U3RhbmRhcmQgeW91dHViZS5jb20vd2F0Y2g/dj1WSURFT19JRA==
      const vParam = url.searchParams.get('v');
      if (vParam) {
        return { id: vParam, isShort };
      }

      // b64:QmFja3VwcyBmb3IgcXVlcnktcGFyYW0gc3RyaW5ncyBpbnNpZGUgcGF0aA==
      const pathParts = url.pathname.split('/');
      // b64:ZS5nLiAvdi9WSURFT19JRA==
      if (pathParts.includes('v') && pathParts[pathParts.indexOf('v') + 1]) {
        return { id: pathParts[pathParts.indexOf('v') + 1], isShort };
      }
    } catch (e) {
      // b64:UmVnZXggZmFsbGJhY2sgaWYgVVJMIGNvbnN0cnVjdG9yIGZhaWxz
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
      const match = trimmed.match(regExp);
      if (match && match[2] && match[2].length === 11) {
        return { id: match[2], isShort: isShort || trimmed.includes('/shorts/') };
      }
    }

    return { id: null, isShort };
  };

  const fetchResults = async (query?: string, pageToFetch: number = 1, tab: 'youtube' | 'tiktok' = activeTab) => {
    if (pageToFetch === 1) {
      setIsLoading(true);
      setResults([]);
    } else {
      setIsLoadingMore(true);
    }
    setError('');
    
    try {
      const isSearch = query && query.trim().length > 0;
      let endpoint = '';
      
      if (tab === 'youtube') {
        const fetchQuery = isSearch ? query : 'gaming videos';
        endpoint = `/api/youtube-search?query=${encodeURIComponent(fetchQuery!)}&page=${pageToFetch}`;
      } else {
        const fetchQuery = isSearch ? query : 'gaming';
        endpoint = `/api/tiktok-search?query=${encodeURIComponent(fetchQuery!)}&page=${pageToFetch}`;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) {
         throw new Error(`Failed to fetch: ${response.status}`);
      }

      // b64:Rm9yY2VmdWxseSBkaXNjYXJkIHJlc3BvbnNlcyBmcm9tIHByZXZpb3VzIHRhYiBpZiBhY3RpdmUgdGFiIGNoYW5nZXMgbWlkLXJlcXVlc3Q=
      if (tab !== activeTabRef.current) {
        return;
      }

      const data = await response.json();
      const items = data.results || [];

      if (tab !== activeTabRef.current) {
        return;
      }
      
      const typedItems = items.map((item: any) => {
        const titleLower = (item.title || '').toLowerCase();
        
        let durationSecs = 999;
        if (item.duration && typeof item.duration === 'string') {
          const parts = item.duration.split(':');
          if (parts.length === 2) {
            durationSecs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          } else if (parts.length === 3) {
            durationSecs = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
          }
        }

        const isShort = tab === 'youtube' && (
          // b64:U3RhbmRhcmQgWW91VHViZSBTaG9ydCBpcyBzdHJpY3RseSA2MCBzZWNvbmRzIG9yIGxlc3M=
          (durationSecs <= 60) ||
          // b64:RmFsbGJhY2sgaWYgbWV0YWRhdGEgaGFzIG5vIGR1cmF0aW9uIGJ1dCB0aXRsZSBleHBsaWNpdGx5IGxpc3RzIGEgc2hvcnRzIHRhZw==
          (!item.duration && (titleLower.includes('#shorts') || titleLower.includes('shorts')))
        );

        let uploadedAgo = item.uploadedAgo || '';
        if (!uploadedAgo && tab === 'tiktok' && /^\d+$/.test(item.id)) {
          try {
            const timeSec = Number(BigInt(item.id) >> 32n);
            if (!isNaN(timeSec) && timeSec > 0) {
              uploadedAgo = formatTimeAgoClient(timeSec * 1000);
            }
          } catch (e) {}
        }

        return {
          ...item,
          uploadedAgo,
          isTikTok: tab === 'tiktok',
          isShort: isShort
        };
      });

      if (pageToFetch === 1) {
        setResults(typedItems);
        setHasMore(typedItems.length > 0);
      } else {
        setResults(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = typedItems.filter((item: MediaItem) => !existingIds.has(item.id));
          if (newItems.length === 0) {
            setHasMore(false);
          }
          return [...prev, ...newItems];
        });
      }
      setPage(pageToFetch);
    } catch (err: any) {
      console.error("API error:", err);
      setError(`We are having trouble contacting the search API for ${tab === 'youtube' ? 'YouTube' : 'TikTok'}. You can still manually load a link below.`);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(searchQuery, 1);
    setSelectedMedia(null);
    setEmbedUrl('');
  };

  const loadMore = () => {
    fetchResults(searchQuery, page + 1);
  };

  const playMedia = (item: MediaItem) => {
    setSelectedMedia(item);
    setIsPortraitPlayer(!!item.isShort);
    if (item.isTikTok) {
      setEmbedUrl(`https://www.tiktok.com/player/v1/${item.id}?autoplay=1`);
    } else {
      setEmbedUrl(`https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualWatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const idInput = formData.get('mediaId') as string;
    if (!idInput) return;

    const trimmedInput = idInput.trim();

    // b64:RXhwbGljaXRseSBjaGVjayBmb3IgeW91dHViZS90aWt0b2sgaW5kaWNhdG9ycyBmaXJzdA==
    const isExplicitYouTube = trimmedInput.includes('youtube.com') || trimmedInput.includes('youtu.be');
    const isExplicitTikTok = trimmedInput.includes('tiktok.com');

    // b64:RGVmYXVsdCB0byBhY3RpdmVUYWIgaWYgbm8gZXhwbGljaXQgaW5kaWNhdG9yIGlzIGZvdW5kIGluIHRoZSBsaW5r
    const targetPlatform = isExplicitTikTok ? 'tiktok' : (isExplicitYouTube ? 'youtube' : activeTab);

    if (targetPlatform === 'tiktok') {
      const parsed = extractTikTokId(trimmedInput);
      if (parsed) {
        let uploadedAgo = '';
        if (/^\d+$/.test(parsed.id)) {
          try {
            const timeSec = Number(BigInt(parsed.id) >> 32n);
            if (!isNaN(timeSec) && timeSec > 0) {
              uploadedAgo = formatTimeAgoClient(timeSec * 1000);
            }
          } catch (e) {}
        }

        const item: MediaItem = {
          id: parsed.id,
          title: parsed.username ? `TikTok by @${parsed.username}` : `TikTok Video (${parsed.id})`,
          thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60',
          views: 'unknown',
          channel: parsed.username ? `@${parsed.username}` : 'TikTok Creator',
          uploadedAgo,
          isTikTok: true
        };
        setSelectedMedia(item);
        setEmbedUrl(`https://www.tiktok.com/player/v1/${parsed.id}?autoplay=1`);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError("Could not parse TikTok Video URL/ID. Double check and try again.");
      }
    } else {
      // b64:WW91VHViZSBmYWxsYmFjaw==
      const { id: finalId, isShort } = extractYouTubeId(trimmedInput);

      if (!finalId) {
        setError("Could not parse YouTube URL or Video/Shorts ID. Double check and try again.");
        return;
      }

      const item: MediaItem = {
        id: finalId,
        title: isShort ? `YouTube Short (${finalId})` : `YouTube Video (${finalId})`,
        thumbnail: `https://i.ytimg.com/vi/${finalId}/mqdefault.jpg`,
        views: 'unknown',
        channel: 'YouTube Video',
        isTikTok: false,
        isShort: isShort
      };
      setSelectedMedia(item);
      setIsPortraitPlayer(isShort);
      setEmbedUrl(`https://www.youtube.com/embed/${finalId}?autoplay=1&rel=0`);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isTikTokPlayer = selectedMedia?.isTikTok;

  return (
    <PageLayout title="YouTube & TikTok" showBack>
      <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 sm:px-0">
        
        {/* Header Tabs Controls and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex bg-zinc-900 rounded-xl p-1.5 border border-zinc-800 self-start sm:self-auto shadow-inner">
               <button 
                 onClick={() => setActiveTab('youtube')}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'youtube' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
               >
                 <Youtube size={18} className={activeTab === 'youtube' ? 'text-red-500' : 'text-zinc-500'} />
                 <span>YouTube</span>
               </button>
               <button 
                 onClick={() => setActiveTab('tiktok')}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'tiktok' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
               >
                 <Music size={18} className={activeTab === 'tiktok' ? 'text-teal-400' : 'text-zinc-500'} />
                 <span>TikTok</span>
               </button>
            </div>

            <form onSubmit={handleSearch} className="relative w-full lg:w-96">
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder={`Search ${activeTab === 'youtube' ? 'YouTube videos' : 'TikToks'}...`}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all font-medium placeholder-zinc-500"
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </form>
        </div>

        {/* Media Player Container */}
        {selectedMedia && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-900/40 p-4 sm:p-6 rounded-2xl border border-zinc-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide text-white ${isTikTokPlayer ? 'bg-teal-500' : 'bg-red-500'}`}>
                        {isTikTokPlayer ? 'TikTok' : 'YouTube'}
                     </span>
                     <span className="text-xs text-zinc-300 font-bold">{selectedMedia.channel}</span>
                     {selectedMedia.views && selectedMedia.views !== 'unknown' && (
                       <>
                         <span className="text-zinc-600 text-xs">•</span>
                         <span className="text-xs text-zinc-400 font-medium">{selectedMedia.views} views</span>
                       </>
                     )}
                     {selectedMedia.uploadedAgo && (
                       <>
                         <span className="text-zinc-600 text-xs">•</span>
                         <span className="text-xs text-zinc-400 font-medium">{selectedMedia.uploadedAgo}</span>
                       </>
                     )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                     {selectedMedia.title || 'Playing Video'}
                  </h2>
                </div>
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                    {!isTikTokPlayer && (
                        <button
                          onClick={() => setIsPortraitPlayer(!isPortraitPlayer)}
                          className="flex items-center justify-center gap-2 text-xs sm:text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all hover:bg-zinc-805 shadow-md flex-1 sm:flex-initial"
                          title={isPortraitPlayer ? "Switch to landscape widescreen" : "Switch to vertical portrait layout for Shorts"}
                        >
                          {isPortraitPlayer ? <Tv size={16} className="text-zinc-400" /> : <Smartphone size={16} className="text-red-400 animate-pulse" />}
                          <span>{isPortraitPlayer ? "Widescreen" : "Shorts Frame"}</span>
                        </button>
                    )}
                    <button 
                      onClick={() => { setSelectedMedia(null); setEmbedUrl(''); }}
                      className="flex items-center justify-center gap-2 text-xs sm:text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all hover:bg-zinc-800 shadow-md flex-1 sm:flex-initial"
                    >
                        <X size={16} /> Close Player
                    </button>
                </div>
            </div>
            
            {isTikTokPlayer ? (
              <TikTokEmbed videoId={selectedMedia.id} username={selectedMedia.username || ''} />
            ) : (
              <div className="w-full flex justify-center bg-zinc-950/40 p-2 sm:p-4 rounded-2xl border border-zinc-900/60 overflow-hidden">
                <div 
                  ref={playerRef} 
                  className={`rounded-xl overflow-hidden border border-zinc-800 bg-black relative shadow-2xl group/player mx-auto transition-all duration-300 ${
                    isPortraitPlayer ? 'aspect-[9/16] w-full max-w-[340px]' : 'aspect-video w-full'
                  }`}
                >
                  <ProxyIframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full bg-black"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="Embed Player"
                  />
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
                    className="absolute bottom-4 right-4 p-2.5 bg-black/60 rounded-full text-white/50 hover:text-white/100 hover:bg-black/90 transition-all opacity-0 group-hover/player:opacity-100 z-50 shadow-lg"
                    title="Fullscreen"
                  >
                    <Maximize size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Catalog List Grid */}
        {!selectedMedia && (
            <>
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              {activeTab === 'youtube' ? (
                                <><Youtube size={16} className="text-red-500" /> YouTube Search RESULTS</>
                              ) : (
                                <><Music size={16} className="text-teal-400" /> TikTok Video Stream</>
                              )}
                          </h3>
                        </div>
                        
                        {error && (
                            <div className="p-6 bg-zinc-900 border border-red-900/30 rounded-2xl mb-8">
                                <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
                                <form onSubmit={handleManualWatch} className="space-y-4">
                                    <h4 className="font-bold text-white text-sm">Direct Video Loader</h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input 
                                           name="mediaId" 
                                           type="text" 
                                           placeholder={activeTab === 'tiktok' ? "TikTok Video Link (e.g. https://www.tiktok.com/@creator/video/1234)" : "YouTube Video ID or Link (e.g. dQw4w9WgXcQ)"} 
                                           className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700 font-medium" 
                                           required 
                                        />
                                        <button type="submit" className={`px-6 py-2.5 ${colors.primaryBg} text-white rounded-xl text-sm font-bold transition-all hover:brightness-110 shadow-md shrink-0`}>
                                           Watch Now
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TikTok uses a taller portrait grid, YouTube uses horizontal widescreen grid */}
                        <div className={`grid gap-6 ${
                          activeTab === 'tiktok' 
                            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        }`}>
                            {results.map((item, i) => (
                                <button 
                                  key={`${item.id}-${i}`}
                                  onClick={() => playMedia(item)}
                                  className="group flex flex-col text-left space-y-3 cursor-pointer outline-none focus:ring-2 focus:ring-white/10 rounded-2xl p-1.5 hover:bg-zinc-900/30 transition-all"
                                >
                                    <div className={`relative rounded-xl overflow-hidden bg-zinc-950 shadow-xl border border-zinc-800/40 group-hover:border-zinc-700 transition-colors w-full ${
                                        activeTab === 'tiktok' ? 'aspect-[9/16]' : 'aspect-video'
                                    }`}>
                                        <img 
                                          src={item.thumbnail} 
                                          alt={item.title}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          loading="lazy"
                                          referrerPolicy="no-referrer"
                                        />
                                        {item.duration && (
                                            <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wider flex items-center gap-1">
                                                {item.isShort && <Smartphone size={10} className="text-red-400" />}
                                                <span>{item.duration}</span>
                                            </div>
                                        )}
                                        {item.isShort && (
                                            <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-extrabold text-white tracking-wider uppercase flex items-center gap-1 shadow-md border border-red-500/30 z-10">
                                                <Smartphone size={10} />
                                                <span>Shorts</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <div className={`w-12 h-12 rounded-full ${activeTab === 'tiktok' ? 'bg-teal-500' : colors.primaryBg} flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl text-white`}>
                                                <Play size={20} fill="currentColor" className="ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-1.5 space-y-1">
                                        <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-2 group-hover:text-white leading-snug tracking-tight">
                                           {item.title}
                                        </h4>
                                        <div className="text-[11px] text-zinc-400 mt-1 flex flex-col gap-0.5">
                                            <span className="font-bold text-zinc-300 line-clamp-1">{item.channel}</span>
                                            <div className="flex items-center gap-1.5 text-zinc-400 font-medium flex-wrap">
                                                {item.views && item.views !== 'unknown' && (
                                                    <span>{item.views} views</span>
                                                )}
                                                {item.views && item.views !== 'unknown' && item.uploadedAgo && (
                                                    <span className="text-zinc-600 font-bold">•</span>
                                                )}
                                                {item.uploadedAgo && (
                                                    <span className="text-zinc-400 font-medium">{item.uploadedAgo}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {!error && results.length > 0 && hasMore && !isLoading && (
                            <div className="flex justify-center mt-12 pb-12">
                                <button 
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className={`px-8 py-3.5 rounded-xl font-bold text-white border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center min-w-[200px] shadow-lg`}
                                >
                                    {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : "Load More Videos"}
                                </button>
                            </div>
                        )}

                        {!error && results.length === 0 && !isLoading && (
                            <div className="text-center py-20 text-zinc-500 text-sm font-medium">
                                No {activeTab === 'youtube' ? 'YouTube videos' : 'TikToks'} found matching that filter.
                            </div>
                        )}
                        
                        {/* Always available Manual Loader section at bottom of layout */}
                        {!error && (
                            <div className="p-6 bg-zinc-900/20 border border-zinc-800/60 rounded-2xl mt-12 shadow-inner">
                                <form onSubmit={handleManualWatch} className="space-y-4">
                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                        {activeTab === 'tiktok' ? (
                                          <><Smartphone size={18} className="text-teal-400" /> Watch TikTok by Link</>
                                        ) : (
                                          <><Youtube size={18} className="text-red-500" /> Watch YouTube by URL</>
                                        )}
                                    </h4>
                                    <p className="text-xs text-zinc-500">
                                        {activeTab === 'tiktok' 
                                          ? "Paste any full TikTok video link (e.g. from the mobile app or browser URL) to load here." 
                                          : "Paste any YouTube link, link share shortcut, or video ID directly into the bar."}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input 
                                           name="mediaId" 
                                           type="text" 
                                           placeholder={activeTab === 'tiktok' ? "TikTok Link (e.g. https://www.tiktok.com/@username/video/7391823...)" : "YouTube URL or video ID (e.g. https://youtu.be/...)"} 
                                           className="flex-1 bg-black border border-zinc-850 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-zinc-700 font-medium placeholder-zinc-600" 
                                           required 
                                        />
                                        <button type="submit" className={`px-6 py-2.5 ${activeTab === 'tiktok' ? 'bg-teal-500 hover:bg-teal-600' : colors.primaryBg} text-white rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0`}>
                                           Play Now
                                        </button>
                                    </div>
                                </form>
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
