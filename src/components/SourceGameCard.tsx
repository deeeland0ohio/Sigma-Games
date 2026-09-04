import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, LucideIcon } from 'lucide-react';

interface SourceGameCardProps {
  id?: string;
  title: string;
  image?: string | null;
  index?: number;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  hoverBorderClass?: string;
  fallbackIcon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  fallbackIconClassName?: string;
}

export default function SourceGameCard({
  title,
  image,
  index = 0,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  hoverBorderClass = 'hover:border-zinc-700',
  fallbackIcon: CustomIcon,
  fallbackIconClassName = 'text-zinc-300',
}: SourceGameCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cleanTitle = (title || 'Untitled Game').trim();
  const initials = cleanTitle.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min((index % 20) * 0.005, 0.1) }}
      className={`group relative w-[150px] h-[150px] min-w-[150px] min-h-[150px] max-w-[150px] max-h-[150px] aspect-square overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 ${hoverBorderClass} transition-all select-none shadow-sm hover:shadow-lg cursor-pointer flex-shrink-0`}
      onClick={onClick}
    >
      {/* Fallback & Initial State Placeholder (Always rendered underneath image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-zinc-950 flex flex-col items-center justify-center p-2.5 text-center pointer-events-none">
        {CustomIcon ? (
          <div className="w-9 h-9 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform duration-200">
            <CustomIcon className={`w-4.5 h-4.5 ${fallbackIconClassName}`} />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-zinc-100 font-bold text-xs mb-2 shadow-sm group-hover:scale-105 transition-transform duration-200">
            {initials}
          </div>
        )}
        <span className="text-zinc-200 text-xs font-medium leading-tight line-clamp-2 px-1 break-words group-hover:text-white transition-colors">
          {cleanTitle}
        </span>
      </div>

      {/* Actual Image */}
      {image && !imageError && (
        <img
          src={image}
          alt={cleanTitle}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}

      {/* Favorites Button */}
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="absolute top-1.5 right-1.5 z-20 p-1 bg-black/70 hover:bg-black/95 backdrop-blur-xs rounded-full text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md hover:scale-110"
        >
          <Heart size={13} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-200'} />
        </button>
      )}

      {/* Top Hover Gradient & Bottom Title Overlay */}
      {image && !imageError && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-1.5 translate-y-0.5 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            <p className="text-white font-semibold text-[11px] text-center leading-tight line-clamp-2 break-words drop-shadow-md">
              {cleanTitle}
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
