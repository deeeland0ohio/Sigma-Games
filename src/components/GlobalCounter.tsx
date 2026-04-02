import React, { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useThemeColors } from '../context/ThemeContext';

export default function GlobalCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const baseUrl = 'https://api.counterapi.dev/v1/sigma-games-global-counter-v1/visits';
        
        // Use a CORS proxy to bypass browser restrictions and adblockers
        const endpoint = `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data && data.count !== undefined) {
          setCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch global counter:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return (
    <div className="inline-flex items-center gap-2 mt-4 text-xs font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-xl">
      {loading ? (
        <Loader2 size={16} className={`animate-spin ${colors.primary}`} />
      ) : (
        <Users size={16} className={colors.primary} />
      )}
      <span>
        Total Global Visits:{' '}
        <span className={`font-bold text-sm ${colors.primary}`}>
          {loading ? '...' : count !== null ? count.toLocaleString() : 'ERR'}
        </span>
      </span>
    </div>
  );
}
