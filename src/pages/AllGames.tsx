import { useState, useEffect } from 'react';
import { allGamesList } from '../data/games';
import { noahGames } from '../data/noah';
import { threekh0Games } from '../data/3kh0';
import { seraphGames } from '../data/seraph';
import { alexrGames } from '../data/alexr';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';
import SearchBar from '../components/SearchBar';

const formatFileName = (raw: string) => {
  let name = raw.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([0-9])([a-zA-Z])/g, '$1 $2');
  name = name.replace(/[-_.]/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return name;
};

const getRunnableUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/')) {
    return url.replace('cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/', 'raw.githack.com/dskjfoisjfsjio/alexrsworld/main/');
  }
  if (url.includes('raw.githubusercontent.com/dskjfoisjfsjio/alexrsworld/refs/heads/main/')) {
    return url.replace('raw.githubusercontent.com/dskjfoisjfsjio/alexrsworld/refs/heads/main/', 'raw.githack.com/dskjfoisjfsjio/alexrsworld/main/');
  }
  if (url.includes('raw.githubusercontent.com/dskjfoisjfsjio/alexrsworld/main/')) {
    return url.replace('raw.githubusercontent.com/dskjfoisjfsjio/alexrsworld/main/', 'raw.githack.com/dskjfoisjfsjio/alexrsworld/main/');
  }
  return url;
};

export default function AllGames() {
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<any[]>([]);
  const [loadingCdns, setLoadingCdns] = useState(true);
  const [visibleCount, setVisibleCount] = useState(120);

  useEffect(() => {
    // Populate with static lists on mount
    const initialList = [
      ...allGamesList.map(g => ({ ...g, source: 'local' })),
      ...noahGames.map((g, idx) => ({
        id: `noah:${idx}:${g.title}`,
        title: g.title,
        description: g.desc,
        url: g.url,
        image: g.image,
        source: "Noah's Hub",
        isExternal: true
      })),
      ...threekh0Games.map((g) => {
        const title = g.title || g.link.replace('projects/', '').replace('/index.html', '').replace(/-/g, ' ');
        const formattedTitle = formatFileName(title);
        return {
          id: `3kh0:${g.link}`,
          title: formattedTitle,
          description: `Play ${formattedTitle} from 3kh0.`,
          url: `https://raw.githack.com/3kh0/3kh0-lite/main/${g.link}`,
          image: g.imgSrc ? (g.imgSrc.startsWith('http') ? g.imgSrc : `https://raw.githubusercontent.com/3kh0/3kh0-lite/main/${g.imgSrc}`) : '',
          source: '3kh0',
          isExternal: true
        };
      }),
      ...seraphGames.map((g) => {
        const displayName = formatFileName(g.id);
        return {
          id: `seraph:${g.id}`,
          title: displayName,
          description: `Play ${displayName} from Seraph.`,
          url: `https://raw.githack.com/a456pur/seraph/main/games/${g.id}/index.html`,
          image: g.image || `https://raw.githubusercontent.com/a456pur/seraph/main/images/thumbnails/${g.id}.jpg`,
          source: 'Seraph',
          isExternal: true
        };
      }),
      ...alexrGames.map((g, idx) => ({
        id: `alexr:${idx}:${g.title}`,
        title: g.title,
        description: g.description,
        url: getRunnableUrl(g.path),
        image: g.img,
        source: 'Alexr',
        isExternal: true
      }))
    ];

    setGames(initialList);

    // Fetch dynamic sources to ensure total integration & accurate counts
    const fetchDynamic = async () => {
      try {
        const [gnRes, ugsRes, alexrRes] = await Promise.allSettled([
          fetch("https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json"),
          fetch("https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js"),
          fetch("https://raw.githubusercontent.com/dskjfoisjfsjio/alexrsworld/refs/heads/main/singlefilegames.json")
        ]);

        const extraGames: any[] = [];
        let hasDynamicAlexr = false;
        let dynamicAlexrGames: any[] = [];

        if (gnRes.status === 'fulfilled' && gnRes.value.ok) {
          const raw = await gnRes.value.json();
          const COVER_BASE = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
          const HTML_BASE = "https://rawcdn.githack.com/freebuisness/html/main";
          const parsed = raw.slice(1).map((z: any) => ({
            id: `gnmath:${z.name}`,
            title: z.name,
            description: `Play ${z.name} from GN-Math.`,
            url: z.url.replace("{HTML_URL}", HTML_BASE),
            image: z.cover.replace("{COVER_URL}", COVER_BASE),
            source: 'gn-math',
            isExternal: true
          }));
          extraGames.push(...parsed);
        }

        if (ugsRes.status === 'fulfilled' && ugsRes.value.ok) {
          const text = await ugsRes.value.text();
          const match = text.match(/files\s*=\s*(\[[\s\S]*?\])/);
          if (match) {
            const files = JSON.parse(match[1]) as string[];
            const parsed = files.map(f => {
              const cleanedFile = f.replace(/\.(html|js|zip|txt)$/i, '');
              const displayName = formatFileName(cleanedFile);
              return {
                id: `ugs:${displayName}`,
                title: displayName,
                description: `Play ${displayName} from UGS.`,
                url: `https://raw.githack.com/bubbls/ugs-singlefile/main/UGS-Files/${encodeURIComponent(f)}`,
                image: '',
                source: 'UGS',
                isExternal: true
              };
            });
            extraGames.push(...parsed);
          }
        }

        if (alexrRes.status === 'fulfilled' && alexrRes.value.ok) {
          const raw = await alexrRes.value.json();
          if (Array.isArray(raw)) {
            dynamicAlexrGames = raw.filter((g: any) => 
              g.title !== "Alexr Code Editor" && 
              g.path !== "https://cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/Apps/codeeditor.html"
            ).map((g: any, idx: number) => ({
              id: `alexr:${idx}:${g.title}`,
              title: g.title,
              description: g.description,
              url: getRunnableUrl(g.path),
              image: g.img,
              source: 'Alexr',
              isExternal: true
            }));
            hasDynamicAlexr = true;
          }
        }

        setGames(prev => {
          const filteredPrev = hasDynamicAlexr 
            ? prev.filter(g => g.source !== 'Alexr')
            : prev;
          return [...filteredPrev, ...extraGames, ...dynamicAlexrGames];
        });
      } catch (err) {
        console.error("Failed to load and merge dynamic CDN files in searching", err);
      } finally {
        setLoadingCdns(false);
      }
    };

    fetchDynamic();
  }, []);

  const filteredGames = games.filter(game => {
    const query = searchQuery.toLowerCase();
    return (
      game.title.toLowerCase().includes(query) ||
      game.description?.toLowerCase().includes(query) ||
      game.source?.toLowerCase().includes(query)
    );
  });

  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <PageLayout 
      title="Our Games" 
      showBack={true} 
      maxWidth="7xl"
    >
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">OUR GAMES</h1>
        <p className="text-zinc-500 mt-2">
          Browse our selection of {games.length > 0 ? games.length : '...'} games! 
          {loadingCdns && <span className="text-xs text-zinc-600 ml-2 animate-pulse">(Connecting CDN indexes...)</span>}
        </p>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search all local and CDN games..." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedGames.length > 0 ? (
          displayedGames.map((game, i) => (
            <GameCard 
              key={`${game.id}-${i}`} 
              game={game} 
              to={game.isExternal ? `/external-player?url=${encodeURIComponent(game.url || '')}&title=${encodeURIComponent(game.title)}&id=${encodeURIComponent(game.id)}&source=${encodeURIComponent(game.source || 'external')}&image=${encodeURIComponent(game.image || '')}&description=${encodeURIComponent(game.description || '')}` : undefined}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No games found matching "{searchQuery}"
          </div>
        )}
      </div>

      {filteredGames.length > visibleCount && (
        <div className="flex justify-center mt-12 mb-6">
          <button
            onClick={() => setVisibleCount(prev => prev + 120)}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Load More Games
          </button>
        </div>
      )}
    </PageLayout>
  );
}
