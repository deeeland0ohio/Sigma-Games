export * from './types';
export * from './cvk';
export * from './diesmos';
export * from './lumin';
export * from './3kh0';
export * from './alexr';
export * from './hydra';
export * from './noah';
export * from './seraph';
export * from './ugs';
export * from './gn-math';
export * from './local';

export const GAME_SOURCES = [
  {
    id: 'local',
    title: 'Sigma Featured',
    description: 'Hand-picked, high performance unblocked games optimized with instant load times.',
    route: '/all-games',
    badge: 'Fast Native'
  },
  {
    id: 'cvk',
    title: "Chicken King's Vault",
    description: "Browse the Chicken King's Vault library of over 1,000 unblocked games.",
    route: '/cvk-games',
    badge: '1,000+ Games'
  },
  {
    id: 'diesmos',
    title: 'Diesmos Games',
    description: 'Browse the Diesmos game collection with hundreds of classic single-file games.',
    route: '/diesmos-games',
    badge: 'Classic Library'
  },
  {
    id: 'lumin',
    title: 'Lumin Games',
    description: 'Browse the curated Lumin Games library of high quality retro & arcade titles.',
    route: '/lumin-games',
    badge: 'Retro & Arcade'
  },
  {
    id: 'gn-math',
    title: 'GN-Math',
    description: 'Browse the GN-Math collection of 800+ games.',
    route: '/gn-math',
    badge: '800+ Games'
  },
  {
    id: 'ugs',
    title: 'Ultimate Game Stash',
    description: 'Browse the Ultimate Game Stash collection of hundreds of games.',
    route: '/ugs-files',
    badge: 'Huge Stash'
  },
  {
    id: 'seraph',
    title: 'Seraph Games',
    description: 'Browse the Seraph collection of community games.',
    route: '/seraph-games',
    badge: 'Community'
  },
  {
    id: '3kh0',
    title: '3kh0 Games',
    description: 'Browse the legendary 3kh0 games library.',
    route: '/3kh0-games',
    badge: 'Legendary'
  },
  {
    id: 'noah',
    title: "Noah's Hub",
    description: "Browse the Noah's Hub game collection.",
    route: '/noah-games',
    badge: 'Curated'
  },
  {
    id: 'alexr',
    title: 'Alexr Games',
    description: 'Browse the Alexr Games single-file library.',
    route: '/alexr-games',
    badge: 'Single File'
  },
  {
    id: 'hydra',
    title: 'Hydra Games',
    description: 'Browse the Hydra Games web archive.',
    route: '/hydra-games',
    badge: 'Archive'
  }
];
