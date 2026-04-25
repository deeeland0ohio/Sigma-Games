import { Folder, Star, Heart, Puzzle, Skull, Zap, FlaskConical, Box } from 'lucide-react';
import { Game } from '../types';
import { allGames } from './games/index';

export type { Game };

export const games: Game[] = [
  {
    id: 'all-games',
    title: 'Our Games',
    description: 'Browse our selection of Games!',
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
    id: 'gn-math',
    title: 'GN-Math',
    description: "Browse the Gn-Math collection of 770 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'ugs',
    title: 'UGS',
    description: "Browse the Ultimate Game Stash collection of 2600+ games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'seraph',
    title: 'Seraph Games',
    description: "Browse the Seraph collection of nearly 500 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: '3kh0',
    title: '3kh0 Games',
    description: "Browse the 3kh0 collection of 145 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'noah',
    title: "Noah's Hub Games",
    description: "Browse a collection of over 400 games.",
    icon: Box,
    type: 'folder',
  },
];

export const allGamesList = [...allGames].sort((a, b) => {
  return a.title.localeCompare(b.title);
});

export const popularGamesList = [...allGames].sort((a, b) => {
  return (b.popularity || 0) - (a.popularity || 0);
});
