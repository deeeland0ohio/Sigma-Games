import { Zap } from 'lucide-react';
import { Game } from '../../types';

export const dogeMiner: Game = {
  id: 'doge-miner',
  title: 'Doge Miner',
  description: 'The Dogecoin Mining Simulator',
  icon: Zap,
  type: 'iframe',
  url: '/games/doge-miner/index.html',
  popularity: 90,
};
