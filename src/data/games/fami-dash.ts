import { Gamepad2 } from 'lucide-react';
import { Game } from '../../types';

export const famiDash: Game = {
  id: 'fami-dash',
  title: "Fami Dash",
  description: "A demake of Geometry Dash for the NES. Jump and fly your way through danger in this rhythm-based action platformer!",
  icon: Gamepad2,
  type: 'iframe',
  url: '/games/fami-dash/index.html',
  popularity: 88,
  series: "Geometry Dash",
  keywords: ["geometry dash", "nes", "retro", "platformer", "rhythm", "fami dash"],
};
