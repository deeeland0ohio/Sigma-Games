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
    if ((game.id === 'hollow-knight-silksong' || game.id === 'repo') && !showWarning) {
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
              {game.id === 'repo' ? 'Loading' : 'Warning!'}
            </h2>
            <p className="text-zinc-400 mb-6">
              {game.id === 'repo' 
                ? "If you see a black screen for a long time, don't worry it's just loading." 
                : "This Game needs at least 4GB of ram to play! Your school Chromebook probably doesn't have that."}
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
    </>
  );
}
