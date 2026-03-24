import { Game } from '../../types';
import { Gamepad2 } from 'lucide-react';

export const fnafWorld: Game = {
  id: 'fnaf-world',
  title: "Five Nights at Freddy's World",
  description: "A fantasy role-playing game featuring the entire cast from the Five Nights at Freddy's series.",
  icon: Gamepad2,
  type: 'iframe',
  url: '/games/fnaf-world/index.html',
  popularity: 90,
  series: 'FNAF',
  seriesOrder: 7,
};
