import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Game } from '../types';
import { useThemeColors } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { Heart, AlertTriangle } from 'lucide-react';

interface GameCardProps {
  game: Game;
  to?: string;
  key?: string | number;
}

export default function GameCard({ game, to }: GameCardProps) {
  const colors = useThemeColors();
  const { isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const Icon = game.icon;
  const targetPath = to || `/play/${game.id}`;
  const favorited = isFavorite(game.id);

  const handleClick = (e: React.MouseEvent) => {
    if ((game.id === 'hollow-knight-silksong' || game.id === 'repo' || game.id === 'gn-math' || game.id === 'ugs' || game.id === 'seraph') && !showWarning) {
      e.preventDefault();
      setShowWarning(true);
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWarning(false);
    navigate(targetPath);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWarning(false);
  };

  const isRed = game.id === 'gn-math';
  const isBlue = game.id === 'ugs';
  const isPurple = game.id === 'seraph';

  const cardHoverBorder = isRed ? 'hover:border-red-500' : isBlue ? 'hover:border-blue-500' : isPurple ? 'hover:border-purple-500' : colors.hoverBorder;
  const cardHoverShadow = isRed ? 'hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]' : isBlue ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]' : isPurple ? 'hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]' : colors.hoverShadow;
  const cardGradientFrom = isRed ? 'from-red-500/10' : isBlue ? 'from-blue-500/10' : isPurple ? 'from-purple-500/10' : colors.gradientFrom;
  const cardGradientVia = (isRed || isBlue || isPurple) ? '' : (colors.gradientVia || '');
  const cardGradientTo = (isRed || isBlue || isPurple) ? 'to-transparent' : colors.gradientTo;
  const cardTertiary = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : isPurple ? 'text-purple-500' : (colors.tertiary || colors.secondary);
  const cardGroupHoverText = isRed ? 'group-hover:text-red-400' : isBlue ? 'group-hover:text-blue-400' : isPurple ? 'group-hover:text-purple-400' : (colors.groupHoverQuaternary || colors.groupHoverText);
  const cardGroupHoverBorder = isRed ? 'group-hover:border-red-500/50' : isBlue ? 'group-hover:border-blue-500/50' : isPurple ? 'group-hover:border-purple-500/50' : colors.groupHoverBorder;
  const titleHoverText = isRed ? 'group-hover:text-red-400' : isBlue ? 'group-hover:text-blue-400' : isPurple ? 'group-hover:text-purple-400' : colors.groupHoverText;
  const cardQuaternary = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : isPurple ? 'text-purple-500' : (colors.quaternary || colors.secondary);

  return (
    <>
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handleCancel}>
          <div 
            className={`bg-zinc-900 border border-zinc-800 ${colors.shadow} rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center text-center`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-12 h-12 rounded-full ${colors.tertiaryBg || colors.secondaryBg} ${colors.groupHoverQuaternary || colors.groupHoverText || 'text-white'} flex items-center justify-center mb-4`}>
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {game.id === 'repo' ? 'Loading' : 
               (game.id === 'gn-math' || game.id === 'ugs' || game.id === 'seraph') ? 'Notice' : 'Warning!'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {game.id === 'repo' 
                ? "If you see a black screen for a long time, don't worry it's just loading." 
                : (game.id === 'gn-math' || game.id === 'ugs' || game.id === 'seraph')
                ? "These aren't hosted on my site, some games here might not work."
                : "This Game needs at least  4GB of ram to play! Your school Chromebook probably doesn't have that."}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                {game.id === 'repo' ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 ${colors.primaryBg} hover:opacity-90 text-white rounded-lg font-medium transition-opacity`}
              >
                {game.id === 'repo' ? 'Play Now' : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link 
        to={targetPath}
        onClick={handleClick}
        className={`group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 ${cardHoverBorder} hover:shadow-xl ${cardHoverShadow} hover:bg-zinc-800/50 transition-all duration-300 flex flex-col items-start gap-4 overflow-hidden`}
      >
      <div className={`absolute inset-0 bg-gradient-to-br ${cardGradientFrom} ${cardGradientVia} ${cardGradientTo} opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      {favorited && (
        <div className={`absolute top-4 right-4 z-20 ${cardQuaternary}`}>
          <Heart size={16} className="fill-current" />
        </div>
      )}

      <div className={`p-3 bg-zinc-950 rounded-xl border border-zinc-800 ${cardTertiary} group-hover:scale-110 ${cardGroupHoverText} ${cardGroupHoverBorder} transition-all`}>
        <Icon size={24} />
      </div>
      <div className="relative z-10">
        <h3 className={`text-lg font-semibold text-zinc-100 ${titleHoverText} transition-colors`}>{game.title}</h3>
        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{game.description}</p>
      </div>
      </Link>
    </>
  );
}
