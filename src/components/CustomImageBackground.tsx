import React, { useState, useEffect } from 'react';

interface CustomImageBackgroundProps {
  config?: {
    imageUrl: string;
    fit: 'cover' | 'contain' | 'repeat';
    tileSize?: number;
    opacity?: number;
    blur?: number;
  };
}

export function CustomImageBackground({ config }: CustomImageBackgroundProps) {
  const imageUrl = config?.imageUrl?.trim();
  const fit = config?.fit || 'contain';
  const tileSize = config?.tileSize ?? 140;
  const opacity = (config?.opacity ?? 100) / 100;
  const blur = config?.blur ?? 0;

  const [activeSrc, setActiveSrc] = useState<string>(imageUrl || '');
  const [proxyIndex, setProxyIndex] = useState<number>(0);

  useEffect(() => {
    setActiveSrc(imageUrl || '');
    setProxyIndex(0);
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="fixed inset-0 bg-[#09090b] -z-50 flex items-center justify-center">
        <div className="text-zinc-600 text-sm font-mono text-center max-w-sm p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          [ No custom background image uploaded. Go to Settings &gt; Background Styles to upload an image. ]
        </div>
      </div>
    );
  }

  const handleImageError = () => {
    if (!imageUrl.startsWith('http')) return;

    if (proxyIndex === 0) {
      setProxyIndex(1);
      setActiveSrc(`https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&output=png`);
    } else if (proxyIndex === 1) {
      setProxyIndex(2);
      setActiveSrc(`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`);
    } else if (proxyIndex === 2) {
      setProxyIndex(3);
      setActiveSrc(`https://corsproxy.io/?${encodeURIComponent(imageUrl)}`);
    }
  };

  const isRepeat = fit === 'repeat';
  const objectFit = fit === 'contain' ? 'contain' : 'cover';
  const safeCssUrl = `url("${(activeSrc || imageUrl).replace(/"/g, '\\"')}")`;

  return (
    <div className="fixed inset-0 bg-[#09090b] -z-50 overflow-hidden pointer-events-none">
      {isRepeat ? (
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            backgroundImage: safeCssUrl,
            backgroundPosition: 'center',
            backgroundSize: `${tileSize}px auto`,
            backgroundRepeat: 'repeat',
            opacity: opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transform: blur > 0 ? 'scale(1.05)' : undefined,
          }}
        />
      ) : (
        <img
          src={activeSrc || imageUrl}
          alt="Custom Background"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none"
          style={{
            objectFit: objectFit,
            objectPosition: 'center',
            opacity: opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transform: blur > 0 ? 'scale(1.05)' : undefined,
          }}
        />
      )}
    </div>
  );
}

export default CustomImageBackground;

