import { Zap, Ghost } from 'lucide-react';
import { Game } from '../../types';

export const solarSmash: Game = {
  id: 'solar-smash',
  title: 'Solar Smash',
  description: 'Planet destruction simulator.',
  icon: Zap,
  type: 'iframe',
  popularity: 83
};

export const theyreComing: Game = {
  id: 'drive-1',
  title: "They're Coming",
  description: 'Survive the endless waves.',
  icon: Ghost,
  type: 'iframe',
  popularity: 79
};

export const ironLung: Game = {
  id: 'iron-lung',
  title: 'Iron Lung',
  description: 'A short horror game set in a blood ocean.',
  icon: Ghost,
  type: 'component',
  popularity: 85
};
