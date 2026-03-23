import { Ghost } from 'lucide-react';
import { Game } from '../../types';

export const fnaf1: Game = {
  id: 'fnaf-1',
  title: "Five Nights at Freddy's",
  description: 'Survive the night shift.',
  icon: Ghost,
  type: 'iframe',
  url: '/games/fnaf-1/index.html',
  popularity: 92,
  series: 'FNAF',
  seriesOrder: 1,
};
