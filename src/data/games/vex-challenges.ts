import { Gamepad2 } from 'lucide-react';
import { Game } from '../../types';

export const vexChallenges: Game = {
  id: 'vex-challenges',
  title: "Vex Challenges",
  description: "Take on a series of specialized challenges designed to test your skills.",
  icon: Gamepad2,
  type: 'iframe',
  url: '/games/vex-challenges/index.html',
  popularity: 95,
  series: "Vex",
  seriesOrder: 9,
};
