import { Target } from 'lucide-react';
import { Game } from '../../types';

export const gunSpin: Game = {
  id: 'gun-spin',
  title: "Gun Spin",
  description: "Shoot your gun to spin it and travel as far as possible.",
  icon: Target,
  type: 'iframe',
  url: '/games/gun-spin/index.html',
  popularity: 97,
  keywords: ["gun", "spin", "distance"],
};
