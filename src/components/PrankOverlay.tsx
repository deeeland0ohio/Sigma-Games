import React, { useEffect, useState, useRef } from 'react';

export default function PrankOverlay() {
  const [isPranked, setIsPranked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace(/^#/, '') || '/');
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace(/^#/, '') || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const checkPrank = () => {
      const queryStr = window.location.search || window.location.hash.split('?')[1] || '';
      const params = new URLSearchParams(queryStr);
      
      if (params.get('token') === 'a7X9qP2zK9vM4jW1nRcTpL5xY8bF3d') {
        localStorage.setItem('isPranked', 'true');
        localStorage.setItem('prankUsedMs', '0');
        localStorage.removeItem('prankCooldownStartTs');
        const d = new Date();
        localStorage.setItem('prankResetDay', `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        window.location.href = '/';
      }

      setIsPranked(localStorage.getItem('isPranked') === 'true');
    };

    checkPrank();
  }, [currentPath]); // Re-check on nav, although token removes params

  useEffect(() => {
    if (!isPranked) return;
    
    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (localStorage.getItem('isPranked') !== 'true') {
        setIsPranked(false);
        return;
      }

      // Midnight reset check
      const d = new Date(now);
      const currentDayString = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const lastResetDayString = localStorage.getItem('prankResetDay');
      
      if (lastResetDayString !== currentDayString) {
        localStorage.setItem('prankResetDay', currentDayString);
        localStorage.setItem('prankUsedMs', '0');
        localStorage.removeItem('prankCooldownStartTs');
      }

      let usedMs = parseInt(localStorage.getItem('prankUsedMs') || '0', 10);
      let cooldownStart = parseInt(localStorage.getItem('prankCooldownStartTs') || '0', 10);

      const TIME_LIMIT_MS = 3 * 60 * 60 * 1000;

      if (usedMs >= TIME_LIMIT_MS) {
        if (!cooldownStart) {
          cooldownStart = now;
          localStorage.setItem('prankCooldownStartTs', cooldownStart.toString());
        }
        
        const cooldownElapsed = now - cooldownStart;
        const cooldownRemaining = Math.max(0, (12 * 60 * 60 * 1000) - cooldownElapsed);
        
        if (cooldownRemaining <= 0) {
          localStorage.setItem('prankUsedMs', '0');
          localStorage.removeItem('prankCooldownStartTs');
          setTimeLeft(TIME_LIMIT_MS / 1000);
          setCooldownLeft(0);
        } else {
          setTimeLeft(0);
          setCooldownLeft(Math.floor(cooldownRemaining / 1000));
        }
      } else {
        // active state
        if (!document.hidden) {
          usedMs += delta;
          if (usedMs > TIME_LIMIT_MS) usedMs = TIME_LIMIT_MS;
          localStorage.setItem('prankUsedMs', usedMs.toString());
        }
        setTimeLeft(Math.ceil((TIME_LIMIT_MS - usedMs) / 1000));
        setCooldownLeft(0);
      }

    }, 100);

    return () => clearInterval(interval);
  }, [isPranked]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCooldown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isPlay = currentPath.startsWith('/play') || currentPath === '/gn-math' || currentPath === '/ugs' || currentPath === '/seraph' || currentPath === '/3kh0' || currentPath === '/noah' || currentPath === '/external-player';
  const topOffset = isPlay ? '64px' : '80px';

  if (!isPranked) return null;

  const outOfTime = timeLeft <= 0;

  return (
    <>
      {!isPlay && (
        <div 
          onClick={() => setShowWarning(true)}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-1.5 bg-black/90 backdrop-blur-md text-white font-mono rounded-lg border border-zinc-800 shadow-xl pointer-events-auto cursor-pointer flex items-center gap-2 hover:bg-black transition-colors"
        >
           <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold hidden sm:inline">Screen Time{outOfTime ? ' over' : ''}:</span>
           <span className={`font-bold ${timeLeft <= 60 && !outOfTime ? 'text-red-500 animate-pulse' : 'text-zinc-100'}`}>
             {formatTime(timeLeft)}
           </span>
           {outOfTime && cooldownLeft > 0 && (
             <>
               <span className="text-zinc-600">|</span>
               <span className="text-green-400 font-bold ml-1">
                 {formatCooldown(cooldownLeft)}
               </span>
             </>
           )}
        </div>
      )}

      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowWarning(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-200 mb-6 text-center text-lg leading-relaxed">
              If ur not Tristan Torres, than email me dylandukerusso@gmail.com and i will fix it.
            </p>
            <button 
              onClick={() => setShowWarning(false)}
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
      
      {outOfTime && currentPath !== '/settings' && (
        <div 
          className="fixed left-0 right-0 bottom-0 z-[90] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center pointer-events-auto border-t border-zinc-800"
          style={{ top: topOffset }}
        >
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
            <h1 className="text-3xl font-bold text-white mb-4">Time Limit Reached</h1>
            <p className="text-zinc-400 text-lg">
              Stop playing block blast, Tristan
            </p>
          </div>
        </div>
      )}
    </>
  );
}

