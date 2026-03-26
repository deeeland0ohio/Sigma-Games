import { Folder, Star, Heart, Puzzle, Skull, Zap } from 'lucide-react';
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

export const allGamesList = [...allGames].sort((a, b) => {
  return a.title.localeCompare(b.title);
});

export const popularGamesList = [...allGames].sort((a, b) => {
  return (b.popularity || 0) - (a.popularity || 0);
});
