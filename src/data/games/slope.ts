import { TrendingDown } from 'lucide-react';
import { Game } from '../../types';

export const slope: Game = {
  id: 'slope',
  title: 'Slope',
  description: 'Roll down the slope for as long as possible without falling off the edge or hitting obstacles.',
  icon: TrendingDown,
  type: 'iframe',
  url: '/games/slope/index.html',
  popularity: 92,
};
