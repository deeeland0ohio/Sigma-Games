import { useState } from 'react';
import { popularGamesList } from '../data/games';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';
import SearchBar from '../components/SearchBar';

export default function PopularGames() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = popularGamesList.filter(game => {
    const query = searchQuery.toLowerCase();
    return (
      game.title.toLowerCase().includes(query) ||
      game.series?.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query)
    );
  });

  return (
    <PageLayout 
      title="Popular Games" 
      showBack={true} 
      maxWidth="7xl"
    >
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">POPULAR GAMES</h1>
        <p className="text-zinc-500 mt-2">The most played games right now, sorted by popularity.</p>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search popular games..." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No games found matching "{searchQuery}"
          </div>
        )}
      </div>
    </PageLayout>
  );
}
