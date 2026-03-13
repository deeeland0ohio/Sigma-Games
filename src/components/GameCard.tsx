import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../types';
import { useThemeColors } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { Heart } from 'lucide-react';

interface GameCardProps {
  game: Game;
  to?: string;
  key?: string | number;
}

export default function GameCard({ game, to }: GameCardProps) {
  const colors = useThemeColors();
  const { isFavorite } = useFavorites();
  const Icon = game.icon;
  const targetPath = to || `/play/${game.id}`;
  const favorited = isFavorite(game.id);

  return (
    <Link 
      to={targetPath}
      className={`group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 ${colors.hoverBorder} hover:shadow-xl ${colors.hoverShadow} hover:bg-zinc-800/50 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientVia || ''} ${colors.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      {favorited && (
        <div className={`absolute top-4 right-4 z-20 ${colors.quaternary || colors.secondary}`}>
          <Heart size={16} className="fill-current" />
        </div>
      )}

      <div className={`p-3 bg-zinc-950 rounded-xl border border-zinc-800 ${colors.tertiary || colors.secondary} group-hover:scale-110 ${colors.groupHoverQuaternary || colors.groupHoverText} ${colors.groupHoverBorder} transition-all`}>
        <Icon size={24} />
      </div>
      <div className="relative z-10">
        <h3 className={`text-lg font-semibold text-zinc-100 ${colors.groupHoverText} transition-colors`}>{game.title}</h3>
        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{game.description}</p>
      </div>
    </Link>
  );
}
