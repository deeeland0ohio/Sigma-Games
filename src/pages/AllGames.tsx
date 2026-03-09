import { allGamesList } from '../data/games';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';

export default function AllGames() {
  return (
    <PageLayout 
      title="All Games" 
      showBack={true} 
      maxWidth="7xl"
    >
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">ALL GAMES</h1>
        <p className="text-zinc-500 mt-2">Browse the complete collection of {allGamesList.length} games.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allGamesList.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </PageLayout>
  );
}
