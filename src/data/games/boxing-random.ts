import { Swords } from 'lucide-react';
import { Game } from '../../types';

export const boxingRandom: Game = {
  id: 'boxing-random',
  title: 'Boxing Random',
  description: 'Boxing Random Battle',
  icon: Swords,
  type: 'iframe',
  url: '/games/boxing-random/index.html',
  popularity: 85,
};
