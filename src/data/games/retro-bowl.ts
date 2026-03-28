import { Trophy } from 'lucide-react';
import { Game } from '../../types';

export const retroBowl: Game = {
  id: 'retro-bowl',
  title: "Retro Bowl",
  description: "The perfect game for the armchair quarterback to finally prove a point.",
  icon: Trophy,
  type: 'iframe',
  url: '/games/retro-bowl/index.html',
  popularity: 99,
  keywords: ["football", "sports", "retro"],
};
