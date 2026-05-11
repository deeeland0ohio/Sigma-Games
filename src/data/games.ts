import { Folder, Heart, Puzzle, Skull, Zap, FlaskConical, Box } from 'lucide-react';
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
    id: 'favorites',
    title: 'Favorites',
    description: 'Your personal collection of favorite games.',
    icon: Heart,
    type: 'folder',
  },
  {
    id: 'gn-math',
    title: 'GN-Math',
    description: "Browse the GN-Math collection of 813 auto-updating games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'ugs',
    title: 'UGS',
    description: "Browse the Ultimate Game Stash collection of 2699 auto-updating games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'seraph',
    title: 'Seraph Games',
    description: "Browse the Seraph collection of 512 auto-updating games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: '3kh0',
    title: '3kh0 Games',
    description: "Browse the 3kh0 collection of 145 auto-updating games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'noah',
    title: "Noah's Hub Games",
    description: "Browse the Noah's Hub collection of 385 auto-updating games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'lumin',
    title: 'LuminSKD',
    description: "Browse the Lumin SDK collection with about 1k games.",
    icon: Box,
    type: 'folder',
  },
];

export const allGamesList = [...allGames].sort((a, b) => {
  return a.title.localeCompare(b.title);
});
