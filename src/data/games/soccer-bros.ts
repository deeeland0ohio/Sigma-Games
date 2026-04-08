import { Gamepad2 } from 'lucide-react';
import { Game } from '../../types';

export const soccerBros: Game = {
  id: 'soccer-bros',
  title: "Soccer Bros",
  description: "Fun, fast-paced 1 on 1 soccer game with lots of action! Pick from a variety of characters and let the play begin.",
  icon: Gamepad2,
  type: 'iframe',
  url: '/games/soccer-bros/index.html',
  popularity: 85,
  series: "Bros",
  keywords: ["soccer", "bros", "sports", "multiplayer", "football"],
};
