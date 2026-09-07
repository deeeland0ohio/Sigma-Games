import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { games } from '../data/games';
import { useThemeColors } from '../context/ThemeContext';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';

interface BootLine {
  text: string;
  className: string;
}

const BOOT_LINES: BootLine[] = [
  { text: '</ SYSTEM STARTING', className: 'text-zinc-500 font-bold font-mono' },
  { text: '</ WELCOME TO SIGMA GAMES!', className: 'glow-green font-bold font-mono' },
  { text: '</ LOADING...', className: 'text-zinc-500 font-mono' },
  { text: '</ AURA INCREASING...', className: 'glow-red font-bold font-mono' },
  { text: '</ DONE! :]', className: 'glow-green font-bold font-mono' }
];

export default function Home() {
  const [bootSequence, setBootSequence] = useState<BootLine[]>([]);
  const colors = useThemeColors();
  const [dynamicGames, setDynamicGames] = useState(games);

  useEffect(() => {
    // Dynamically fetch and update collection game counts to guarantee accuracy
    const fetchCounts = async () => {
      // 1. GN Math
      fetch("https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json")
        .then(res => res.json())
        .then((raw: any) => {
          if (Array.isArray(raw)) {
            const count = raw.slice(1).length;
            setDynamicGames(prev => prev.map(g => g.id === 'gn-math' ? { ...g, description: `Browse the GN-Math collection of ${count} games.` } : g));
          }
        }).catch(() => {});

      // 2. UGS (Ultimate Game Stash)
      fetch("https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js")
        .then(res => res.text())
        .then(text => {
          const match = text.match(/let files = \[(.*?)\];/s);
          if (match) {
            const arrayText = `[${match[1]}]`;
            const stringMatches = [...arrayText.matchAll(/"([^"]+)"|'([^']+)'/g)];
            const parsedFiles = stringMatches.map(m => m[1] || m[2]).filter(f => f !== '?');
            if (parsedFiles.length > 0) {
              setDynamicGames(prev => prev.map(g => g.id === 'ugs' ? { ...g, description: `Browse the Ultimate Game Stash collection of ${parsedFiles.length} games.` } : g));
            }
          }
        }).catch(() => {});

      // 3. Seraph Games
      fetch('https://api.github.com/repos/a456pur/seraph/git/trees/main?recursive=1')
        .then(res => res.json())
        .then((data: any) => {
          if (data && data.tree) {
            const count = data.tree.filter((node: any) => node.path.startsWith('games/') && node.path.split('/').length === 2 && node.type === 'tree').length;
            if (count > 0) {
              setDynamicGames(prev => prev.map(g => g.id === 'seraph' ? { ...g, description: `Browse the Seraph collection of ${count} games.` } : g));
            }
          }
        }).catch(() => {});

      // 4. 3kh0 Games
      fetch('https://api.github.com/repos/3kh0/3kh0-lite/git/trees/main?recursive=1')
        .then(res => res.json())
        .then((data: any) => {
          if (data && data.tree) {
            const count = data.tree.filter((node: any) => node.path.startsWith('projects/') && node.path.split('/').length === 2 && node.type === 'tree').length;
            if (count > 0) {
              setDynamicGames(prev => prev.map(g => g.id === '3kh0' ? { ...g, description: `Browse the 3kh0 collection of ${count} games.` } : g));
            }
          }
        }).catch(() => {});

      // 5. Noah's Hub Games
      fetch('https://cdn.jsdelivr.net/gh/NoahsAmazingTutoringHelp/Noahs-Calculus-Tutor@master/games.js')
        .then(async (res) => {
          if (!res.ok) throw new Error("Fetch failed");
          const text = await res.text();
          if (!text || !text.includes('games')) throw new Error("Invalid format");
          const fnText = text.replace(/const games\s*=/, "return");
          const gamesArray = (new Function(fnText))();
          if (Array.isArray(gamesArray) && gamesArray.length > 0) {
            setDynamicGames(prev => prev.map(g => g.id === 'noah' ? { ...g, description: `Browse the Noah's Hub collection of ${gamesArray.length} games.` } : g));
          }
        }).catch(() => {});

      // 6. Alexr Games
      fetch("https://cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/singlefilegames.json")
        .then(res => res.json())
        .then((raw: any) => {
          if (Array.isArray(raw)) {
            const count = raw.filter((g: any) => g.title !== "Alexr Code Editor" && g.path !== "https://cdn.jsdelivr.net/gh/dskjfoisjfsjio/alexrsworld@main/Apps/codeeditor.html").length;
            setDynamicGames(prev => prev.map(g => g.id === 'alexr' ? { ...g, description: `Browse the Alexr Games collection of ${count} games.` } : g));
          }
        }).catch(() => {});

      // 7. Hydra Games
      fetch("https://cdn.jsdelivr.net/gh/zennedu/hydra@main/gmes.json")
        .then(res => res.json())
        .then((raw: any) => {
          if (Array.isArray(raw)) {
            setDynamicGames(prev => prev.map(g => g.id === 'hydra' ? { ...g, description: `Browse the Hydra Games collection of ${raw.length} games.` } : g));
          }
        }).catch(() => {});

      // 8. Chicken King's Vault (CVK)
      fetch("https://cdn.jsdelivr.net/gh/WanoCapy/ChickenKingsVault@main/games.js")
        .then(res => res.text())
        .then(text => {
          const matches = text.match(/<a class="game-link"/g);
          if (matches && matches.length > 0) {
            setDynamicGames(prev => prev.map(g => g.id === 'cvk' ? { ...g, description: `Browse the Chicken King's Vault collection of ${matches.length} games.` } : g));
          }
        }).catch(() => {});
    };

    fetchCounts();
  }, []);

  useEffect(() => {

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < BOOT_LINES.length) {
        const lineToAppend = BOOT_LINES[currentLine];
        setBootSequence(prev => [...prev, lineToAppend]);
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
        <section 
          className={`bg-black border border-zinc-800 rounded-xl p-6 font-mono text-sm md:text-base shadow-2xl ${colors.shadow}`}
        >
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-4 text-zinc-500">
            <div className={`w-3 h-3 rounded-full ${colors.primaryBg}`}></div>
            <div className={`w-3 h-3 rounded-full ${colors.tertiaryBg || colors.secondaryBg}`}></div>
            <div className={`w-3 h-3 rounded-full ${colors.secondaryBg}`}></div>
            <span className="ml-2 text-xs uppercase tracking-widest text-zinc-500">ACCESSING SIGMA GAMES...</span>
          </div>
          <div className="space-y-2 min-h-[140px]">
            {bootSequence.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 ${line.className}`}
              >
                {line.text}
              </motion.div>
            ))}
            {bootSequence.length === BOOT_LINES.length && (
              <div className="flex items-start group relative mt-2 text-zinc-500 font-bold font-mono">
                <span className="mr-2 mt-[2px]">&gt;</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-5 bg-[#ff4a4a] shadow-[0_0_8px_#ff4a4a] rounded-sm mt-[2px]"
                />
              </div>
            )}
          </div>
        </section>

        {/* Games Grid */}
        <section id="games" className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">OPTIONS</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dynamicGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                to={
                  game.id === 'all-games' ? '/our-games' : 
                  game.id === 'entertainment' ? '/entertainment' :
                  game.id === 'popular' ? '/popular' : 
                  game.id === 'favorites' ? '/favorites' : 
                  game.id === 'gn-math' ? '/gn-math' :
                  game.id === 'ugs' ? '/ugs' :
                  game.id === 'seraph' ? '/seraph' :
                  game.id === '3kh0' ? '/3kh0' :
                  game.id === 'noah' ? '/noah' :
                  game.id === 'alexr' ? '/alexr' :
                  game.id === 'hydra' ? '/hydra' :
                  game.id === 'diesmos' ? '/diesmos' :
                  game.id === 'lumin' ? '/lumin' :
                  game.id === 'cvk' ? '/cvk' :
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
