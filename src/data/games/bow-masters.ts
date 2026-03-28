import { Target } from 'lucide-react';
import { Game } from '../../types';

export const bowMasters: Game = {
  id: 'bow-masters',
  title: 'Bowmasters',
  description: 'A fun archery game where you aim and shoot at opponents.',
  icon: Target,
  type: 'iframe',
  url: '/games/bow-masters/index.html',
  popularity: 100,
};
