import { Bomb } from 'lucide-react';
import { Game } from '../../types';

export const ballBlast: Game = {
  id: 'ball-blast',
  title: 'Ball Blast',
  developer: 'Voodoo',
  description: 'Shoot the balls and upgrade your cannon in this addictive arcade game.',
  icon: Bomb,
  type: 'iframe',
  url: '/games/ball-blast/index.html',
  tags: ['Arcade', 'Action', 'Shooter'],
  rating: 4.5,
  plays: "20K+",
  thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f563?w=500&q=80'
};
