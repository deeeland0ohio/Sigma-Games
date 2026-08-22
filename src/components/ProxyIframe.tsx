import React, { useEffect, useRef, useState } from 'react';

interface ProxyIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src?: string;
  srcDoc?: string;
}

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
  // b64:S2VlcCBkb21haW4gKHRlc3RpbmdjZi9mYXN0bHkvY2RuL3F1YW50aWwpIGFzIGlzLCBidXQgbm9ybWFsaXplIGFueSBvdXRkYXRlZCBjb21taXQgaGFzaGVzIG9yIGJyYW5jaGVzIHdpdGggQG1haW4gZm9yIGtub3duIHJlcG9zaXRvcmllcw==
  cleaned = cleaned.replace(
    /(https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/(?:aDiesmos|WanoCapy|3kh0|a456pur|greenday894|HydroXide1|Noah-Is-Awesome|alexr-hub)\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
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

  // b64:WW91VHViZSBub3JtYWxpemF0aW9uICh3YXRjaCwgc2hvcnRzLCB5b3V0dS5iZSwgZW1iZWQp
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
  }

  // b64:VGlrVG9rIG5vcm1hbGl6YXRpb24gKHZpZGVvIGxpbmtzLCB2LCBlbWJlZCk=
  if (trimmed.includes('tiktok.com')) {
    const ttMatch = trimmed.match(/tiktok\.com\/(?:@[^\/]+\/video\/|v\/|embed\/v2\/|embed\/v3\/|embed\/|player\/v1\/)(\d+)/i) ||
                    trimmed.match(/tiktok\.com\/.*\/(\d+)/i);
    if (ttMatch && ttMatch[1]) {
      return `https://www.tiktok.com/player/v1/${ttMatch[1]}?autoplay=1`;
    }
  }

  return cleanGameUrl(trimmed);
}

export default function ProxyIframe({ src, srcDoc, allow, allowFullScreen = true, ...props }: ProxyIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    // b64:SWYgc3JjRG9jIGlzIHByb3ZpZGVkIGRpcmVjdGx5LCBsZXQgUmVhY3QgaGFuZGxlIGl0IHZpYSB0aGUgcHJvcA==
    if (srcDoc) return;
    
    if (src && iframeRef.current) {
      const iframe = iframeRef.current;
      const targetUrl = normalizeEmbedUrl(src);
      if (!targetUrl) return;
      
      let isMounted = true;

      // b64:VmlkZW8gZW1iZWRzIChZb3VUdWJlLCBUaWtUb2spIG11c3QgcnVuIG5hdGl2ZWx5IGluIHRoZSBpZnJhbWUgdG8gYWxsb3cgcGxheWVyIHNjcmlwdHMgJiBtZWRpYSBkZWNvZGVycw==
      if (isVideoEmbed(targetUrl)) {
        setFallbackSrc(targetUrl);
        return;
      }

      const fetchHtml = async (fetchUrl: string): Promise<string | null> => {
        try {
          const response = await fetch(fetchUrl);
          if (response.ok) {
            return await response.text();
          }
        } catch (err) {
          // Direct fetch failed, fallback to server evasion proxy
        }
        try {
          const proxyRes = await fetch(`/api/evasion-proxy?url=${encodeURIComponent(fetchUrl)}`);
          if (proxyRes.ok) {
            return await proxyRes.text();
          }
        } catch (proxyErr) {
          console.warn("Proxy fallback fetch failed:", proxyErr);
        }
        return null;
      };

      const loadContent = async () => {
        let currentUrl = targetUrl;
        let html: string | null = null;

        // b64:UmVjdXJzaXZlIHVud3JhcHBpbmcgKHVwIHRvIDMgbGV2ZWxzKSBmb3Igd3JhcHBlciBwYWdlcyB0aGF0IGhvc3QgdGhlIGdhbWUgaW4gYW4gaW5uZXIgaWZyYW1l
        for (let depth = 0; depth < 3; depth++) {
          const fetched = await fetchHtml(currentUrl);
          if (!fetched) break;
          html = fetched;

          // b64:Q2hlY2sgaWYgdGhpcyBIVE1MIGlzIGFuIGlmcmFtZSB3cmFwcGVyIHBhZ2UgKGUuZy4sIENWSyB3cmFwcGVycyB0aGF0IGVtYmVkIHRoZSBhY3R1YWwgZ2FtZSBpbiBhbiBpZnJhbWUp
          // b64:V3JhcHBlciBwYWdlcyBoYXZlIGFuIGlmcmFtZSB3aXRoIGEgc3JjIGF0dHJpYnV0ZSBhbmQgRE8gTk9UIHRoZW1zZWx2ZXMgaGF2ZSBnYW1lIGNhbnZhcy9lbmdpbmVz
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
                  continue; // b64:TG9vcCB0byBmZXRjaCB0aGUgYWN0dWFsIGlubmVyIGdhbWUgSFRNTA==
                } catch (urlErr) {
                  // Fall through
                }
              }
            }
          }
          break;
        }

        if (html && isMounted) {
          // b64:MS4gUmV3cml0ZSBicm9rZW4gY29tbWl0IGhhc2hlcyBnbG9iYWxseSBpbnNpZGUgdGhlIEhUTUwsIHByZXNlcnZpbmcgdGhlIG9yaWdpbmFsIGRvbWFpbg==
          html = html.replace(
            /(https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/(?:aDiesmos|WanoCapy|3kh0|a456pur|greenday894|HydroXide1|Noah-Is-Awesome|alexr-hub)\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
            '$1@main$3'
          );

          // b64:Mi4gU3RyaXAgYW5ub3lpbmcgbW9uZXRpemVkIG92ZXJsYXkgd2lkZ2V0cyAobGlrZSBhcmMuaW8pIHRoYXQgY2x1dHRlci9icmVhayB0aGUgZ2FtZSBVSQ==
          html = html.replace(/<script[^>]*src="[^"]*arc\.io[^"]*"[^>]*><\/script>/gi, '<!-- stripped arc.io -->');

          // b64:My4gU3RyaXAgYW5hbHl0aWNzL3RyYWNrZXJzIChHb29nbGV0YWdtYW5hZ2VyLCBndGFnKQ==
          html = html.replace(/<script[^>]*src="[^"]*googletagmanager\.com[^"]*"[^>]*><\/script>/gi, '<!-- stripped google tag manager -->');
          html = html.replace(/gtag\s*\([^)]*\);?/gi, '');

          // b64:NC4gQnlwYXNzIHJvb3QtcmVsYXRpdmUgL2pzL21haW4uanMgd2hpY2ggZmFpbHMgb24gb3VyIGRvbWFpbg==
          html = html.replace(/src=["']\/js\/main\.js["']/gi, 'src="data:text/javascript,console.log(\'main.js bypassed\')"');

          // b64:NS4gSW5qZWN0IHNhZmUgbG9jYWxTdG9yYWdlIC8gc2Vzc2lvblN0b3JhZ2UgcG9seWZpbGwgdG8gcHJldmVudCBBY2Nlc3MgRGVuaWVkIGV4Y2VwdGlvbnMgaW4gc2FuZGJveGVkIGRvY3VtZW50cw==
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

          // b64:Ni4gSW5qZWN0IGJhc2UgdGFnIHNvIHJlbGF0aXZlIGFzc2V0cyBsb2FkIGNvcnJlY3RseQ==
          const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
          const baseTag = `<base href="${baseUrl}">`;

          if (!html.includes('<base ')) {
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
            } else {
              html = `${storagePolyfill}\n${html}`;
            }
          }

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
  }, [src, srcDoc]);

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
