import { Game } from '../../types';
import { CircleDashed } from 'lucide-react';

export const basketballStars: Game = {
  id: 'basketball-stars',
  title: 'Basketball Stars',
  description: 'Play basketball with the stars in this fast-paced sports game.',
  icon: CircleDashed,
  type: 'iframe',
  url: '/games/basketball-stars/index.html',
  popularity: 90,
};
