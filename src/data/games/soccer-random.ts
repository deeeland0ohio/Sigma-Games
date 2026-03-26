import { Goal } from 'lucide-react';
import { Game } from '../../types';

export const soccerRandom: Game = {
  id: 'soccer-random',
  title: 'Soccer Random',
  description: 'A hilarious and fast-paced soccer game with ragdoll physics and unpredictable gameplay.',
  icon: Goal,
  type: 'iframe',
  url: '/games/soccer-random/index.html',
  popularity: 85,
};
