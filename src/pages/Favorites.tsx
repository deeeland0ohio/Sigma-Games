import { allGamesList } from '../data/games';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';
import { useFavorites } from '../context/FavoritesContext';
import { Heart } from 'lucide-react';
import { useThemeColors } from '../context/ThemeContext';

export default function Favorites() {
  const { favorites } = useFavorites();
  const colors = useThemeColors();
  
  const favoriteGames = allGamesList.filter(game => favorites.includes(game.id));

  return (
    <PageLayout 
      title="Favorites" 
      showBack={true} 
      maxWidth="7xl"
    >
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Favorites</h1>
          <Heart className={`fill-current ${colors.secondary}`} size={28} />
        </div>
        <p className="text-zinc-500 mt-2">Your personal collection of favorite games.</p>
      </div>

      {favoriteGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
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
