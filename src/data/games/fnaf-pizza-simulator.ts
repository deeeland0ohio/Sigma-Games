import { Gamepad2 } from 'lucide-react';
import { Game } from '../../types';

export const fnafPizzaSimulator: Game = {
  id: 'fnaf-pizza-simulator',
  title: "Five Nights at Freddy's Pizza Simulator",
  description: "A business simulation game where you manage your own Freddy Fazbear's Pizzeria.",
  icon: Gamepad2,
  type: 'iframe',
  url: '/games/fnaf-pizza-simulator/index.html',
  popularity: 88,
  series: 'fnaf',
  seriesOrder: 7,
};
