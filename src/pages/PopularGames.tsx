import { popularGamesList } from '../data/games';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';

export default function PopularGames() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {popularGamesList.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </PageLayout>
  );
}
