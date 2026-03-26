import { Spade } from 'lucide-react';
import { Game } from '../../types';

export const blackJack: Game = {
  id: 'black-jack',
  title: 'Black Jack',
  developer: 'Synic',
  description: 'Play blackjack game online made using vanilla Javascript.',
  icon: Spade,
  type: 'iframe',
  url: '/games/black-jack/index.html',
  tags: ['Card', 'Casino', 'Table'],
  rating: 4.6,
  plays: "15K+",
  thumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&q=80'
};
