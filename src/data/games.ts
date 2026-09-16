import { Folder, Heart, Puzzle, Skull, Zap, FlaskConical, Box, Video } from 'lucide-react';
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
    id: 'entertainment',
    title: 'YouTube & TikTok',
    description: 'Watch, search and browse YouTube and TikTok videos.',
    icon: Video,
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
    description: "Browse the GN-Math collection of 818 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'ugs',
    title: 'UGS',
    description: "Browse the Ultimate Game Stash collection of 2932 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'seraph',
    title: 'Seraph Games',
    description: "Browse the Seraph collection of 494 games.",
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
    description: "Browse the Noah's Hub collection of 416 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'alexr',
    title: 'Alexr Games',
    description: "Browse the Alexr Games collection of 676 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'hydra',
    title: 'Hydra Games',
    description: "Browse the Hydra Games collection of 164 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'diesmos',
    title: 'Diesmos Games',
    description: "Browse the Diesmos Games collection of 1039 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'lumin',
    title: 'Lumin Games',
    description: "Browse the Lumin Games collection of 1253 games.",
    icon: Box,
    type: 'folder',
  },
  {
    id: 'cvk',
    title: "Chicken King's Vault (CVK)",
    description: "Browse the Chicken King's Vault collection of 838 games.",
    icon: Box,
    type: 'folder',
  },
];

export const allGamesList = [...allGames].sort((a, b) => {
  return a.title.localeCompare(b.title);
});
