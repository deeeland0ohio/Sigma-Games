import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { games, allGamesList } from '../data/games';
import { useThemeColors } from '../context/ThemeContext';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';

export default function Home() {
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [randomGameId, setRandomGameId] = useState<string | null>(null);
  const colors = useThemeColors();
  const bootLines = [
    '</ SYSTEM STARTING',
    "</ WELCOME TO SIGMA GAMES.",
    '</ CONNECTING',
    '</ GAMES LOADING...',
    '</ READY TO PLAY...'
  ];

  useEffect(() => {
    // Pick a random game on mount
    if (allGamesList.length > 0) {
      const randomGame = allGamesList[Math.floor(Math.random() * allGamesList.length)];
      setRandomGameId(randomGame.id);
    }

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootLines.length) {
        setBootSequence(prev => [...prev, bootLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageLayout title="Home">
      <div className="space-y-24">
        {/* Terminal Boot Sequence */}
        <section className={`bg-black border border-zinc-800 rounded-xl p-6 font-mono text-sm md:text-base shadow-2xl ${colors.hoverShadow.replace('hover:', '')}`}>
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-4 text-zinc-500">
            <div className={`w-3 h-3 rounded-full ${colors.primaryBg}`}></div>
            <div className={`w-3 h-3 rounded-full ${colors.tertiaryBg || colors.secondaryBg}`}></div>
            <div className={`w-3 h-3 rounded-full ${colors.secondaryBg}`}></div>
            <span className="ml-2 text-xs uppercase tracking-widest text-zinc-500">ACCESSING SIGMA GAMES...</span>
          </div>
          <div className={`space-y-2 ${colors.terminalText} min-h-[140px]`}>
            {bootSequence.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                {line}
              </motion.div>
            ))}
            {bootSequence.length === bootLines.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`w-2 h-5 ${colors.cursor} mt-2`}
              />
            )}
          </div>
        </section>

        {/* Games Grid */}
        <section id="games" className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">ALL GAMES</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                to={
                  game.id === 'all-games' ? '/all-games' : 
                  game.id === 'popular' ? '/popular' : 
                  game.id === 'favorites' ? '/favorites' : 
                  game.id === 'random' && randomGameId ? `/play/${randomGameId}` :
                  undefined
                }
              />
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
