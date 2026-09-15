import React, { useState } from 'react';
import { Download, ExternalLink, Image as ImageIcon, Video, Music, Copy, Check } from 'lucide-react';

interface MediaBlockProps {
  type: 'image' | 'video' | 'audio';
  src: string;
  alt?: string;
  title?: string;
}

export const MediaBlock: React.FC<MediaBlockProps> = ({ type, src, alt, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(src);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon size={14} className="text-emerald-400" />;
      case 'video':
        return <Video size={14} className="text-purple-400" />;
      case 'audio':
        return <Music size={14} className="text-amber-400" />;
    }
  };

  return (
    <div className="my-3 rounded-xl border border-zinc-800 bg-[#0d1117] overflow-hidden shadow-xl text-left">
      {/* Media Window Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          {getIcon()}
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider truncate">
            {title || alt || `Generated ${type}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-sans font-medium transition-all cursor-pointer shadow-sm active:scale-95"
            title="Copy URL"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy URL</span>
              </>
            )}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-sans font-medium transition-all shadow-sm"
            title="Open / Download"
          >
            <Download size={12} />
            <span>Open</span>
          </a>
        </div>
      </div>

      {/* Media Content */}
      <div className="p-3 bg-black/40 flex items-center justify-center">
        {type === 'image' && (
          <img
            src={src}
            alt={alt || 'Generated artwork'}
            referrerPolicy="no-referrer"
            className="max-h-96 w-auto max-w-full rounded-lg object-contain shadow-md"
            loading="lazy"
          />
        )}
        {type === 'video' && (
          <div className="w-full flex flex-col items-center">
            {src.includes('youtube.com') || src.includes('youtu.be') || src.includes('vimeo.com') ? (
              <iframe
                src={
                  src.includes('youtube.com/watch?v=')
                    ? src.replace('watch?v=', 'embed/')
                    : src.includes('youtu.be/')
                    ? src.replace('youtu.be/', 'www.youtube.com/embed/')
                    : src
                }
                title={title || 'Video player'}
                className="w-full aspect-video rounded-lg shadow-md border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={src}
                controls
                playsInline
                preload="metadata"
                className="max-h-96 w-full rounded-lg shadow-md bg-black"
                onError={(e) => {
                  console.warn('Video failed to load inline:', src);
                }}
              >
                Your browser does not support HTML5 video tag.
              </video>
            )}
          </div>
        )}
        {type === 'audio' && (
          <div className="w-full py-3 px-2">
            <audio src={src} controls className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
