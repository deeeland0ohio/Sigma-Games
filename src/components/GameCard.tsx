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
    if ((game.id === 'hollow-knight-silksong' || game.id === 'repo' || game.id === 'gn-math' || game.id === 'ugs' || game.id === 'seraph' || game.id === '3kh0' || game.id === 'noah' || game.id === 'alexr') && !showWarning) {
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
  const isTeal = game.id === '3kh0';
  const isOrange = game.id === 'noah';
  const isGray = game.id === 'alexr';

  const cardHoverBorder = isRed ? 'hover:border-red-500' : isBlue ? 'hover:border-blue-500' : isPurple ? 'hover:border-purple-500' : isTeal ? 'hover:border-teal-500' : isOrange ? 'hover:border-orange-500' : isGray ? 'hover:border-zinc-500' : colors.hoverBorder;
  const cardHoverShadow = isRed ? 'hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]' : isBlue ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]' : isPurple ? 'hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]' : isTeal ? 'hover:shadow-[0_0_15px_rgba(20,184,166,0.2)]' : isOrange ? 'hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]' : isGray ? 'hover:shadow-[0_0_15px_rgba(113,113,122,0.2)]' : colors.hoverShadow;
  const cardGradientFrom = isRed ? 'from-red-500/10' : isBlue ? 'from-blue-500/10' : isPurple ? 'from-purple-500/10' : isTeal ? 'from-teal-500/10' : isOrange ? 'from-orange-500/10' : isGray ? 'from-zinc-500/10' : colors.gradientFrom;
  const cardGradientVia = (isRed || isBlue || isPurple || isTeal || isOrange || isGray) ? '' : (colors.gradientVia || '');
  const cardGradientTo = (isRed || isBlue || isPurple || isTeal || isOrange || isGray) ? 'to-transparent' : colors.gradientTo;
  const cardTertiary = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : isPurple ? 'text-purple-500' : isTeal ? 'text-teal-500' : isOrange ? 'text-orange-500' : isGray ? 'text-zinc-400' : (colors.tertiary || colors.secondary);
  const cardGroupHoverText = isRed ? 'group-hover:text-red-400' : isBlue ? 'group-hover:text-blue-400' : isPurple ? 'group-hover:text-purple-400' : isTeal ? 'group-hover:text-teal-400' : isOrange ? 'group-hover:text-orange-400' : isGray ? 'group-hover:text-zinc-300' : (colors.groupHoverQuaternary || colors.groupHoverText);
  const cardGroupHoverBorder = isRed ? 'group-hover:border-red-500/50' : isBlue ? 'group-hover:border-blue-500/50' : isPurple ? 'group-hover:border-purple-500/50' : isTeal ? 'group-hover:border-teal-500/50' : isOrange ? 'group-hover:border-orange-500/50' : isGray ? 'group-hover:border-zinc-500/50' : colors.groupHoverBorder;
  const titleHoverText = isRed ? 'group-hover:text-red-400' : isBlue ? 'group-hover:text-blue-400' : isPurple ? 'group-hover:text-purple-400' : isTeal ? 'group-hover:text-teal-400' : isOrange ? 'group-hover:text-orange-400' : isGray ? 'group-hover:text-zinc-300' : colors.groupHoverText;
  const cardQuaternary = isRed ? 'text-red-500' : isBlue ? 'text-blue-500' : isPurple ? 'text-purple-500' : isTeal ? 'text-teal-500' : isOrange ? 'text-orange-500' : isGray ? 'text-zinc-400' : (colors.quaternary || colors.secondary);

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
               (game.id === 'gn-math' || game.id === 'ugs' || game.id === 'seraph' || game.id === '3kh0' || game.id === 'noah' || game.id === 'alexr') ? 'Notice' : 'Warning!'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {game.id === 'repo' 
                ? "If you see a black screen for a long time, don't worry it's just loading." 
                : (game.id === 'gn-math' || game.id === 'ugs' || game.id === 'seraph' || game.id === '3kh0' || game.id === 'noah' || game.id === 'alexr')
                ? "These aren't hosted on my site, some games here might not work. And there might be ads."
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

      {game.image ? (
        <div className={`w-full aspect-video rounded-xl overflow-hidden mb-2 border border-zinc-800`}>
          <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`p-3 bg-zinc-950 rounded-xl border border-zinc-800 ${cardTertiary} group-hover:scale-110 ${cardGroupHoverText} ${cardGroupHoverBorder} transition-all`}>
          <Icon size={24} />
        </div>
      )}
      <div className="relative z-10 w-full">
        {game.source && game.source !== 'local' && game.source !== 'Alexr' && game.source !== 'alexr' && (
          <span className="text-xs font-semibold text-zinc-500 block mb-0.5">
            {game.source === 'gn-math' ? 'Gn-Math:' : `${game.source}:`}
          </span>
        )}
        <h3 className={`text-lg font-semibold text-zinc-100 ${titleHoverText} transition-colors`}>{game.title}</h3>
        <p className="text-sm text-zinc-500 mt-1 whitespace-normal break-words">{game.description}</p>
      </div>
      </Link>
    </>
  );
}
