import { Car } from 'lucide-react';
import { Game } from '../../types';

export const driveMad: Game = {
  id: 'drive-mad',
  title: "Drive Mad",
  description: "Drive Mad is a car game where you drive on a track filled with obstacles. Your goal is to reach the finish line in one piece.",
  icon: Car,
  type: 'iframe',
  url: '/games/drive-mad/index.html',
  popularity: 98,
  series: "Drive Mad",
  keywords: ["car", "driving", "physics", "obstacles", "fancade"],
};
