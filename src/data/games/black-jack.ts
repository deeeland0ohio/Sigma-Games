import { Spade } from 'lucide-react';
import { Game } from '../../types';

export const blackJack: Game = {
  id: 'black-jack',
  title: 'Black Jack',
  description: 'Play blackjack game online made using vanilla Javascript.',
  icon: Spade,
  type: 'iframe',
  url: '/games/black-jack/index.html',
};
