import { Folder, Star, Heart, Puzzle } from 'lucide-react';
import { Game } from '../types';
import { allGames } from './games/index';

export type { Game };

export const games: Game[] = [
  {
    id: 'all-games',
    title: 'All Games',
    description: 'Browse the complete collection of games.',
    icon: Folder,
    type: 'folder',
  },
  {
    id: 'popular',
    title: 'Popular',
    description: 'The most played games right now.',
    icon: Star,
    type: 'folder',
  },
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Your personal collection of favorite games.',
    icon: Heart,
    type: 'folder',
  },
  {
    id: 'random',
    title: 'Random Game',
    description: 'Feeling lucky? Play a random game from our collection.',
    icon: Puzzle,
    type: 'folder',
  },
];

const seriesPopularity: Record<string, number> = {};
allGames.forEach(g => {
  if (g.series) {
    seriesPopularity[g.series] = Math.max(seriesPopularity[g.series] || 0, g.popularity || 0);
  }
});

export const allGamesList = [...allGames].sort((a, b) => {
  const keyA = a.series || a.title;
  const keyB = b.series || b.title;
  if (keyA !== keyB) {
    return keyA.localeCompare(keyB);
  }
  return (a.seriesOrder || 0) - (b.seriesOrder || 0);
});

export const popularGamesList = [...allGames].sort((a, b) => {
  const keyA = a.series || a.id;
  const keyB = b.series || b.id;
  
  if (keyA !== keyB) {
    const popA = a.series ? seriesPopularity[a.series] : (a.popularity || 0);
    const popB = b.series ? seriesPopularity[b.series] : (b.popularity || 0);
    if (popA !== popB) {
      return popB - popA;
    }
    const titleA = a.series || a.title;
    const titleB = b.series || b.title;
    return titleA.localeCompare(titleB);
  }
  
  return (a.seriesOrder || 0) - (b.seriesOrder || 0);
});
