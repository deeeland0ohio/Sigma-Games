import React, { useEffect, useRef, useState } from 'react';

export interface ContentFrameProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src?: string;
  srcDoc?: string;
  reloadKey?: number;
}

const gameHtmlCache = new Map<string, string>();

export function getJsDelivrUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'raw.githubusercontent.com' || urlObj.hostname === 'raw.githack.com' || urlObj.hostname === 'rawcdn.githack.com') {
      let pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts[2] === 'refs' && pathParts[3] === 'heads') {
        pathParts.splice(2, 2);
      }
      if (pathParts.length >= 4) {
        const user = pathParts[0];
        const repo = pathParts[1];
        const branch = pathParts[2];
        const filePath = pathParts.slice(3).join('/');
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${filePath}`;
      }
    }
  } catch (e) {}
  return url;
}

export function cleanGameUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  let cleaned = getJsDelivrUrl(url);
  if (!cleaned || typeof cleaned !== 'string') return '';
  // Normalize gn-math asset sources
  cleaned = cleaned.replace(/\/gh\/gn-math\//gi, '/gh/freebuisness/');
  // Keep domain as is, but normalize any outdated commit hashes or branches with @main for known repositories
  cleaned = cleaned.replace(
    /(https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/(?:aDiesmos|WanoCapy|3kh0|a456pur|greenday894|HydroXide1|Noah-Is-Awesome|alexr-hub|bubbls|lonya-k|genizy|degloved-net|freebuisness)\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
    '$1@main$3'
  );
  return cleaned;
}

export function isVideoEmbed(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = urlObj.hostname.toLowerCase();
    return (
      host.includes('youtube.com') ||
      host.includes('youtube-nocookie.com') ||
      host.includes('youtu.be') ||
      host.includes('tiktok.com') ||
      host.includes('vimeo.com') ||
      host.includes('dailymotion.com')
    );
  } catch (e) {
    return false;
  }
}

export function normalizeEmbedUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // YouTube normalization (watch, shorts, youtu.be, embed)
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
  }

  // TikTok normalization (video links, v, embed)
  if (trimmed.includes('tiktok.com')) {
    const ttMatch = trimmed.match(/tiktok\.com\/(?:@[^\/]+\/video\/|v\/|embed\/v2\/|embed\/v3\/|embed\/|player\/v1\/)(\d+)/i) ||
                    trimmed.match(/tiktok\.com\/.*\/(\d+)/i);
    if (ttMatch && ttMatch[1]) {
      return `https://www.tiktok.com/player/v1/${ttMatch[1]}?autoplay=1`;
    }
  }

  return cleanGameUrl(trimmed);
}

export default function ContentFrame({ src, srcDoc, reloadKey, allow, allowFullScreen = true, ...props }: ContentFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    // If srcDoc is provided directly, let React handle it via the prop
    if (srcDoc) return;
    
    if (src && iframeRef.current) {
      const iframe = iframeRef.current;
      const targetUrl = normalizeEmbedUrl(src);
      if (!targetUrl) return;
      
      let isMounted = true;

      // Video embeds (YouTube, TikTok) run natively in the iframe
      if (isVideoEmbed(targetUrl)) {
        setFallbackSrc(targetUrl);
        return;
      }

      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      // If already cached, directly re-inject the pristine game code
      if (gameHtmlCache.has(targetUrl)) {
        const cachedHtml = gameHtmlCache.get(targetUrl)!;
        if (doc) {
          doc.open();
          doc.write(cachedHtml);
          doc.close();
          return;
        }
      }

      const fetchHtml = async (fetchUrl: string): Promise<string | null> => {
        try {
          const response = await fetch(fetchUrl);
          if (response.ok) {
            return await response.text();
          }
        } catch (err) {
          // Fallback to server content loader
        }
        try {
          const proxyRes = await fetch(`/api/content-loader?url=${encodeURIComponent(fetchUrl)}`);
          if (proxyRes.ok) {
            return await proxyRes.text();
          }
        } catch (proxyErr) {
          console.warn("Content loader fetch failed:", proxyErr);
        }
        return null;
      };

      const loadContent = async () => {
        let currentUrl = targetUrl;
        let html: string | null = null;

        // Recursive unwrapping (up to 3 levels) for wrapper pages
        for (let depth = 0; depth < 3; depth++) {
          const fetched = await fetchHtml(currentUrl);
          if (!fetched) break;
          html = fetched;

          const hasGameEngine = (
            html.includes('<canvas') ||
            html.includes('data.unityweb') ||
            html.includes('Module=') ||
            html.includes('GODOT_CONFIG') ||
            html.includes('ruffle') ||
            html.includes('kaboom(') ||
            html.includes('Phaser.')
          );

          if (!hasGameEngine) {
            const iframeMatch = html.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
            if (iframeMatch && iframeMatch[1]) {
              const innerSrc = iframeMatch[1].trim();
              if (innerSrc && !isVideoEmbed(innerSrc) && !innerSrc.startsWith('javascript:')) {
                try {
                  const resolvedUrl = new URL(innerSrc, currentUrl).href;
                  currentUrl = cleanGameUrl(resolvedUrl);
                  continue;
                } catch (urlErr) {
                  // Fall through
                }
              }
            }
          }
          break;
        }

        if (html && isMounted) {
          // 1. Switch any gn-math to freebuisness
          html = html.replace(/\/gh\/gn-math\//gi, '/gh/freebuisness/');

          // 2. Rewrite broken commit hashes globally inside the HTML, preserving the original domain
          html = html.replace(
            /(https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/(?:aDiesmos|WanoCapy|3kh0|a456pur|greenday894|HydroXide1|Noah-Is-Awesome|alexr-hub|bubbls|lonya-k|degloved-net|freebuisness)\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
            '$1@main$3'
          );

          // 2b. Map blocked jsdelivr genizy repositories to content-loader proxy
          html = html.replace(
            /https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/genizy\/([^/@]+)(?:@([^\/'" >]+))?\//gi,
            (_match, repo, branch) => {
              const b = branch && branch !== 'latest' ? branch : 'main';
              return `/api/content-loader/raw.githubusercontent.com/genizy/${repo}/${b}/`;
            }
          );

          // 3. Strip overlay widgets that clutter the UI
          html = html.replace(/<script[^>]*src="[^"]*arc\.io[^"]*"[^>]*><\/script>/gi, '<!-- stripped overlay -->');

          // 4. Strip external analytics scripts
          html = html.replace(/<script[^>]*src="[^"]*googletagmanager\.com[^"]*"[^>]*><\/script>/gi, '<!-- stripped analytics -->');
          html = html.replace(/gtag\s*\([^)]*\);?/gi, '');

          // 5. Replace missing root-relative script references
          html = html.replace(/src=["']\/js\/main\.js["']/gi, 'src="data:text/javascript,console.log(\'main.js loaded\')"');

          // 6. Inject safe localStorage / sessionStorage polyfill to prevent access errors in sandboxed documents
          const storagePolyfill = `<script>
            (function() {
              var mem = {};
              var sessionMem = {};
              try {
                window.localStorage.getItem('__test__');
              } catch(e) {
                try {
                  Object.defineProperty(window, 'localStorage', {
                    value: {
                      getItem: function(k) { return mem[k] !== undefined ? mem[k] : null; },
                      setItem: function(k, v) { mem[k] = String(v); },
                      removeItem: function(k) { delete mem[k]; },
                      clear: function() { mem = {}; },
                      key: function(i) { return Object.keys(mem)[i] || null; },
                      get length() { return Object.keys(mem).length; }
                    },
                    configurable: true,
                    writable: true
                  });
                  Object.defineProperty(window, 'sessionStorage', {
                    value: {
                      getItem: function(k) { return sessionMem[k] !== undefined ? sessionMem[k] : null; },
                      setItem: function(k, v) { sessionMem[k] = String(v); },
                      removeItem: function(k) { delete sessionMem[k]; },
                      clear: function() { sessionMem = {}; },
                      key: function(i) { return Object.keys(sessionMem)[i] || null; },
                      get length() { return Object.keys(sessionMem).length; }
                    },
                    configurable: true,
                    writable: true
                  });
                } catch(err) {}
              }
            })();
          </script>`;

          // 7. Inject base tag so relative assets load correctly:
          if (!html.includes('<base ')) {
            let effectiveBaseUrl = '';
            const cdnMatch = html.match(/(https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/[^\s"'><]+|https?:\/\/(?:raw\.githack\.com|rawcdn\.githack\.com)\/[^\s"'><]+)/i);
            if (cdnMatch && cdnMatch[1]) {
              const cdnAssetUrl = cleanGameUrl(cdnMatch[1]);
              effectiveBaseUrl = cdnAssetUrl.substring(0, cdnAssetUrl.lastIndexOf('/') + 1);
            } else if (currentUrl.startsWith('http://') || currentUrl.startsWith('https://')) {
              effectiveBaseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
            } else if (currentUrl.startsWith('/')) {
              effectiveBaseUrl = window.location.origin + currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
            }

            if (effectiveBaseUrl) {
              const baseTag = `<base href="${effectiveBaseUrl}">`;
              if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>\n${baseTag}\n${storagePolyfill}`);
              } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html>\n<head>\n${baseTag}\n${storagePolyfill}\n</head>`);
              } else {
                html = `${baseTag}\n${storagePolyfill}\n${html}`;
              }
            } else {
              if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>\n${storagePolyfill}`);
              } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html>\n<head>\n${storagePolyfill}\n</head>`);
              } else {
                html = `${storagePolyfill}\n${html}`;
              }
            }
          } else {
            if (html.includes('<head>')) {
              html = html.replace('<head>', `<head>\n${storagePolyfill}`);
            } else {
              html = `${storagePolyfill}\n${html}`;
            }
          }

          gameHtmlCache.set(targetUrl, html);

          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            return;
          }
        }

        if (isMounted) {
          setFallbackSrc(currentUrl || targetUrl);
        }
      };

      loadContent();

      return () => {
        isMounted = false;
        if (iframeRef.current) {
           const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
           if (doc) {
               doc.open();
               doc.write('');
               doc.close();
           }
        }
      };
    }
  }, [src, srcDoc, reloadKey]);

  const defaultAllow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

  return (
    <iframe
      ref={iframeRef}
      src={fallbackSrc}
      srcDoc={srcDoc}
      allow={allow || defaultAllow}
      allowFullScreen={allowFullScreen}
      referrerPolicy={props.referrerPolicy || "strict-origin-when-cross-origin"}
      {...props}
    />
  );
}
