import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Loader2 } from 'lucide-react';

export default function LuminGames() {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // We add the script dynamically
    const scriptId = 'lumin-sdk-script';
    
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    const handleScriptLoad = () => {
      initLumin();
      setLoading(false);
    };

    const handleScriptError = () => {
      console.error("Failed to load Lumin SDK");
      setLoading(false);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js';
      script.async = true;
      script.addEventListener('load', handleScriptLoad);
      script.addEventListener('error', handleScriptError);
      document.body.appendChild(script);
    } else {
      if ((window as any).Lumin) {
         initLumin();
         setLoading(false);
      } else {
        script.addEventListener('load', handleScriptLoad);
        script.addEventListener('error', handleScriptError);
      }
    }
    
    return () => {
      if (script) {
        script.removeEventListener('load', handleScriptLoad);
        script.removeEventListener('error', handleScriptError);
      }
    };
  }, []);

  useEffect(() => {
    if (refreshKey > 0 && (window as any).Lumin) {
      setTimeout(() => {
        initLumin();
        setLoading(false);
      }, 50);
    }
  }, [refreshKey]);

  const hideRandomButton = () => {
    const container = document.querySelector(`#games-${refreshKey}`);
    if (!container) return;
    
    const root = container.shadowRoot || container;
    const buttons = root.querySelectorAll('button, div[role="button"]');
    
    buttons.forEach(btn => {
      const text = (btn.textContent || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const className = (typeof btn.className === 'string' ? btn.className : '').toLowerCase();
      
      if (
        text.includes('random') || 
        title.includes('random') || 
        ariaLabel.includes('random') ||
        className.includes('random')
      ) {
        (btn as HTMLElement).style.setProperty('display', 'none', 'important');
      }
    });

    // Also try injecting a style tag into the shadow root for good measure
    if (container.shadowRoot && !container.shadowRoot.querySelector('#lumin-custom-fixes')) {
      const style = document.createElement('style');
      style.id = 'lumin-custom-fixes';
      style.textContent = `
        button[title*="Random" i], 
        button[aria-label*="Random" i],
        button[class*="random" i] { display: none !important; }
      `;
      container.shadowRoot.appendChild(style);
    }
  };

  const initLumin = () => {
    if ((window as any).Lumin) {
      try {
        (window as any).Lumin.init({
          container: `#games-${refreshKey}`,
          theme: 'dark'
        });
        
        // Poll for a few seconds to hide the random button once it renders
        let attempts = 0;
        const interval = setInterval(() => {
          hideRandomButton();
          attempts++;
          if (attempts > 30) clearInterval(interval);
        }, 100);
        
      } catch(e) {
        console.error("Error initializing Lumin", e);
      }
    }
  };

  const handleRefreshLumin = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PageLayout title="LuminSKD">
      <style>{`
        .games-wrapper {
          --lumin-bg: transparent !important;
          --lumin-surface: #18181b !important;
          --lumin-surface-hover: #27272a !important;
          --lumin-border: #27272a !important;
          --lumin-text: #ffffff !important;
          --lumin-text-secondary: #a1a1aa !important;
          --lumin-accent: #ef4444 !important;
          --lumin-accent-hover: #f87171 !important;
          --lumin-input-bg: #18181b !important;
          --lumin-input-border: #27272a !important;
          --lumin-card-shadow: none !important;
          --lumin-skeleton: #27272a !important;
          --lumin-skeleton-shine: #3f3f46 !important;
        }
        
        @media (min-width: 1024px) {
          .games-wrapper {
             --lumin-columns: 5 !important;
          }
        }
        @media (min-width: 1280px) {
          .games-wrapper {
             --lumin-columns: 6 !important;
          }
        }
      `}</style>
      <div className="flex flex-col flex-1 w-full relative">
        <div className="w-full flex justify-end mb-4 px-4 sm:px-0 mt-4 sm:mt-0">
          <button 
            onClick={handleRefreshLumin} 
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Refresh Games
          </button>
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-zinc-500 z-10 min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-medium">Loading LuminSKD...</span>
          </div>
        )}
        <div key={refreshKey} id={`games-${refreshKey}`} className="games-wrapper w-full min-h-[500px] text-white"></div>
      </div>
    </PageLayout>
  );
}

