import { Car } from 'lucide-react';
import { Game } from '../../types';

export const escapeRoad: Game = {
  id: 'escape-road',
  title: 'Escape Road',
  description: 'Drive as fast as you can to escape the police in this high-speed car chase game. Avoid obstacles and collect coins to upgrade your vehicle.',
  icon: Car,
  type: 'iframe',
  url: '/games/escape-road/index.html',
  popularity: 90,
};
