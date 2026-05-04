import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Loader2 } from 'lucide-react';

export default function LuminGames() {
  const [loading, setLoading] = useState(true);
  const [luminError, setLuminError] = useState<string | null>(null);

  useEffect(() => {
    // We add the script dynamically
    const scriptId = 'lumin-sdk-script';
    
    // Check if script already exists (might happen in dev with HMR or fast navigation)
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script is already there, it might have loaded already
      if ((window as any).Lumin) {
         initLumin();
         setLoading(false);
         return;
      }
    }

    script.addEventListener('load', () => {
      initLumin();
      setLoading(false);
    });
    
    script.addEventListener('error', () => {
      console.error("Failed to load Lumin SDK");
      setLoading(false);
    });

    function initLumin() {
      if ((window as any).Lumin) {
        try {
          // ensure the container exists
          const container = document.querySelector('#games');
          if (container) {
            container.innerHTML = ''; // clear previous instances
          }
          
          // Intercept console.error to catch Lumin domain fetch failures
          const originalConsoleError = console.error;
          console.error = (...args) => {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('Worker connection failed')) {
              setLoading(false);
              setLuminError("Lumin SDK is restricted to registered domains.");
            }
            originalConsoleError.apply(console, args);
          };

          (window as any).Lumin.init({
            container: '#games',
            theme: 'dark' // We also apply global overrides to ensure it matches our theme perfectly
          });
          
          // Restore console error after a few seconds assuming initialization finished
          setTimeout(() => {
            console.error = originalConsoleError;
          }, 5000);
          
        } catch(e) {
          console.error("Error initializing Lumin", e);
          setLuminError("An error occurred while initializing the Lumin SDK.");
        }
      }
    }

    return () => {
      // We don't remove the script so we don't redownload it, 
      // but if there are specific cleanups Lumin supports, do them here.
    };
  }, []);

  return (
    <PageLayout title="LuminSKD">
      <style>{`
        #games {
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
          #games {
             --lumin-columns: 5 !important;
          }
        }
        @media (min-width: 1280px) {
          #games {
             --lumin-columns: 6 !important;
          }
        }
      `}</style>
      <div className="flex flex-col flex-1 w-full relative">
        {luminError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl min-h-[400px]">
            <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">SDK Connection Failed</h3>
            <p className="text-zinc-400 max-w-md">{luminError}</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-zinc-500 z-10 min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-3 font-medium">Loading LuminSKD...</span>
              </div>
            )}
            <div id="games" className="w-full min-h-[500px] text-white"></div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
