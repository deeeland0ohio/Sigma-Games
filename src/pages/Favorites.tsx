import { useState } from 'react';
import { allGamesList } from '../data/games';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';
import SearchBar from '../components/SearchBar';
import { useFavorites, FavoriteItem } from '../context/FavoritesContext';
import { Heart, Gamepad2 } from 'lucide-react';
import { useThemeColors } from '../context/ThemeContext';

export default function Favorites() {
  const { favorites } = useFavorites();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  
  const favoriteGames = favorites.map((f: string | FavoriteItem) => {
    if (typeof f === 'string') return allGamesList.find(g => g.id === f);
    if (f.source === 'local') return allGamesList.find(g => g.id === f.id);
    
    // b64:Rm9yIGV4dGVybmFsIGdhbWVzLCBjb25zdHJ1Y3QgYSBjb21wYXRpYmxlIG9iamVjdA==
    return {
      id: f.id,
      title: f.title || 'Unknown Game',
      description: f.description || `Play ${f.title} from ${f.source}.`,
      type: 'iframe',
      url: f.url,
      icon: Gamepad2, // Fallback icon
      image: f.image,
      source: f.source,
      isExternal: true
    };
  }).filter(Boolean) as any[];

  const filteredGames = favoriteGames.filter(game => {
    const query = searchQuery.toLowerCase();
    return (
      game.title.toLowerCase().includes(query) ||
      game.series?.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query)
    );
  });

  return (
    <PageLayout 
      title="Favorites" 
      showBack={true} 
      maxWidth="7xl"
    >
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Favorites</h1>
          <Heart className={`fill-current ${colors.quaternary || colors.secondary}`} size={28} />
        </div>
        <p className="text-zinc-500 mt-2">Your personal collection of favorite games.</p>
      </div>

      {favoriteGames.length > 0 && (
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search favorites..." />
      )}

      {favoriteGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                to={game.isExternal ? `/external-player?url=${encodeURIComponent(game.url || '')}&title=${encodeURIComponent(game.title)}&id=${encodeURIComponent(game.id)}&source=${encodeURIComponent(game.source || 'external')}&image=${encodeURIComponent(game.image || '')}&description=${encodeURIComponent(game.description || '')}` : undefined}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No favorites found matching "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="p-6 bg-zinc-900/50 rounded-full border border-zinc-800">
            <Heart className="text-zinc-700" size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-medium text-zinc-300">No favorites yet</h2>
            <p className="text-zinc-500 max-w-xs mx-auto">
              Start playing games and click the heart icon to add them to your favorites!
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
