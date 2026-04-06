import { Clock } from 'lucide-react';
import { Game } from '../../types';

export const timeShooter: Game = {
  id: 'time-shooter',
  title: 'Time Shooter',
  description: 'Time moves only when you move in this action-packed shooter.',
  icon: Clock,
  type: 'iframe',
  url: '/games/time-shooter/index.html',
  popularity: 82,
};
