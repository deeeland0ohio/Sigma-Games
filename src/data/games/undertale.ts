import { Heart } from 'lucide-react';
import { Game } from '../../types';

export const undertale: Game = {
  id: 'undertale',
  title: 'Undertale',
  description: "The RPG game where you don't have to destroy anyone.",
  icon: Heart,
  type: 'iframe',
  url: '/games/undertale/index.html',
  popularity: 95,
  series: 'Undertale',
  seriesOrder: 1,
};
