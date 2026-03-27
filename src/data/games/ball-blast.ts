import { Bomb } from 'lucide-react';
import { Game } from '../../types';

export const ballBlast: Game = {
  id: 'ball-blast',
  title: 'Ball Blast',
  description: 'Shoot the balls and upgrade your cannon in this addictive arcade game.',
  icon: Bomb,
  type: 'iframe',
  url: '/games/ball-blast/index.html',
};
