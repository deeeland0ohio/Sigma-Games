import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FavoriteItem {
  id: string;
  source: string;
  title?: string;
  url?: string;
  image?: string;
  description?: string;
}

interface FavoritesContextType {
  favorites: (string | FavoriteItem)[];
  toggleFavorite: (item: string | FavoriteItem) => void;
  isFavorite: (gameId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<(string | FavoriteItem)[]>(() => {
    const saved = localStorage.getItem('game_hub_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('game_hub_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (item: string | FavoriteItem) => {
    const gameId = typeof item === 'string' ? item : item.id;
    
    setFavorites(prev => {
      const isFav = prev.some(f => (typeof f === 'string' ? f : f.id) === gameId);
      if (isFav) {
        return prev.filter(f => (typeof f === 'string' ? f : f.id) !== gameId);
      } else {
        const newItem = typeof item === 'string' ? { id: item, source: 'local' as const } : item;
        return [...prev, newItem];
      }
    });
  };

  const isFavorite = (gameId: string) => favorites.some(f => (typeof f === 'string' ? f : f.id) === gameId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
