import { Gamepad2 } from 'lucide-react';
import { Game } from '../../types';

export const omori: Game = {
  id: 'omori',
  title: 'OMORI',
  description: 'Explore a strange world full of colorful friends and foes.',
  icon: Gamepad2,
  type: 'iframe',
  url: '/games/omori/index.html',
  popularity: 90,
};
