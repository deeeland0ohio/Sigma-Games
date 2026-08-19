import React, { useEffect, useRef, useState } from 'react';

interface ProxyIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src?: string;
  srcDoc?: string;
}

export function getJsDelivrUrl(url: string) {
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

export function cleanGameUrl(url: string) {
  let cleaned = getJsDelivrUrl(url);
  // Keep domain (testingcf/fastly/cdn) as is, but replace any outdated commit hash or branch with @main for any aDiesmos repositories
  cleaned = cleaned.replace(
    /(https?:\/\/(?:testingcf|fastly|cdn)\.jsdelivr\.net\/gh\/aDiesmos\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
    '$1@main$3'
  );
  return cleaned;
}

export function isVideoEmbed(url: string) {
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

export default function ProxyIframe({ src, srcDoc, allow, allowFullScreen = true, ...props }: ProxyIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    // If srcDoc is provided directly, let React handle it via the prop
    if (srcDoc) return;
    
    if (src && iframeRef.current) {
      const iframe = iframeRef.current;
      const targetUrl = cleanGameUrl(src);
      
      let isMounted = true;

      // Video embeds (YouTube, TikTok) must run natively in the iframe to allow player scripts & media decoders
      if (isVideoEmbed(targetUrl)) {
        setFallbackSrc(targetUrl);
        return;
      }

      const loadContent = async () => {
        try {
          // Attempt to fetch the content directly for lightspeed bypass
          const response = await fetch(targetUrl);
          if (response.ok) {
            let html = await response.text();
            
            // 1. Rewrite broken commit hashes globally inside the HTML, preserving the original domain (testingcf/fastly/cdn)
            html = html.replace(
              /(https?:\/\/(?:testingcf|fastly|cdn)\.jsdelivr\.net\/gh\/aDiesmos\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
              '$1@main$3'
            );

            // 2. Strip annoying monetized overlay widgets (like arc.io) that clutter/break the game UI
            html = html.replace(/<script[^>]*src="[^"]*arc\.io[^"]*"[^>]*><\/script>/gi, '<!-- stripped arc.io -->');

            // 3. Strip analytics/trackers (Googletagmanager, gtag)
            html = html.replace(/<script[^>]*src="[^"]*googletagmanager\.com[^"]*"[^>]*><\/script>/gi, '<!-- stripped google tag manager -->');
            html = html.replace(/gtag\s*\([^)]*\);?/gi, '');

            // 4. Bypass root-relative /js/main.js which fails on our domain (returning 404 or index.html)
            html = html.replace(/src=["']\/js\/main\.js["']/gi, 'src="data:text/javascript,console.log(\'main.js bypassed\')"');
            
            // Inject base tag so relative assets load correctly
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            const baseTag = `<base href="${baseUrl}">`;
            
            if (!html.includes('<base ')) {
              if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>\n${baseTag}`);
              } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html>\n<head>\n${baseTag}\n</head>`);
              } else {
                html = baseTag + '\n' + html;
              }
            }
            
            if (isMounted) {
              const doc = iframe.contentDocument || iframe.contentWindow?.document;
              if (doc) {
                doc.open();
                doc.write(html);
                doc.close();
              }
            }
            return;
          }
        } catch (err) {
          // Direct fetch failed, attempt evasion proxy
          try {
            const proxyRes = await fetch(`/api/evasion-proxy?url=${encodeURIComponent(targetUrl)}`);
            if (proxyRes.ok) {
              let html = await proxyRes.text();
              const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
              const baseTag = `<base href="${baseUrl}">`;
              if (!html.includes('<base ')) {
                if (html.includes('<head>')) {
                  html = html.replace('<head>', `<head>\n${baseTag}`);
                } else if (html.includes('<html>')) {
                  html = html.replace('<html>', `<html>\n<head>\n${baseTag}\n</head>`);
                } else {
                  html = baseTag + '\n' + html;
                }
              }
              if (isMounted) {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc) {
                  doc.open();
                  doc.write(html);
                  doc.close();
                }
                return;
              }
            }
          } catch (proxyErr) {
            console.warn("Proxy fallback fetch failed, falling back to direct src:", proxyErr);
          }
        }
        
        if (isMounted) {
          setFallbackSrc(targetUrl);
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
      {...props}
    />
  );
}
