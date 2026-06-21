import { useState, useEffect } from 'react';
import { allGamesList } from '../data/games';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';
import SearchBar from '../components/SearchBar';

export default function AllGames() {
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(120);

  useEffect(() => {
    // Populate with only our local games list
    const initialList = allGamesList.map(g => ({ ...g, source: 'local' }));
    setGames(initialList);
  }, []);

  const filteredGames = games.filter(game => {
    const query = searchQuery.toLowerCase();
    return (
      game.title.toLowerCase().includes(query) ||
      game.description?.toLowerCase().includes(query)
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
        </p>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search all of our games..." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedGames.length > 0 ? (
          displayedGames.map((game, i) => (
            <GameCard 
              key={`${game.id}-${i}`} 
              game={game} 
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
