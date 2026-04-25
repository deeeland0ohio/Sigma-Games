import { useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Maximize, X, Heart } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useFavorites } from '../context/FavoritesContext';

export default function ExternalPlayer() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'External Game';
  const id = searchParams.get('id') || url || '';
  const image = searchParams.get('image') || '';
  const source = searchParams.get('source') || 'external';
  const description = searchParams.get('description') || '';
  
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (!url) {
      navigate('/games', { replace: true });
    }
  }, [url, navigate]);

  if (!url) return null;

  return (
    <PageLayout title={title} showBack>
      <div className="w-full h-full flex flex-col bg-black rounded-xl overflow-hidden border border-zinc-800" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <h3 className="text-white font-medium pl-2 truncate flex-1">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                toggleFavorite({
                  id,
                  title,
                  url: url || '',
                  image,
                  source: source as any,
                  description
                });
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={isFavorite(id) ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart className={`w-5 h-5 ${isFavorite(id) ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={() => {
                 const btn = document.getElementById('external-iframe') as HTMLIFrameElement;
                 if (btn) btn.requestFullscreen?.();
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 w-full relative">
          <iframe
            id="external-iframe"
            src={url}
            className="w-full h-full border-none bg-black"
            allow="autoplay; fullscreen; pointer-lock; keyboard-map"
            allowFullScreen
            title={title}
          />
        </div>
      </div>
    </PageLayout>
  );
}
