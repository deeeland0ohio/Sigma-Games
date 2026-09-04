import { Router, Request, Response } from "express";

const router = Router();

// MIME type lookup helper
function getMimeType(urlPath: string, headerType: string | null): string {
  const cleanPath = urlPath.split('?')[0].toLowerCase();
  if (cleanPath.endsWith('.wasm')) return 'application/wasm';
  if (cleanPath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (cleanPath.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (cleanPath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (cleanPath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (cleanPath.endsWith('.html') || cleanPath.endsWith('.htm')) return 'text/html; charset=utf-8';
  if (cleanPath.endsWith('.png')) return 'image/png';
  if (cleanPath.endsWith('.jpg') || cleanPath.endsWith('.jpeg')) return 'image/jpeg';
  if (cleanPath.endsWith('.gif')) return 'image/gif';
  if (cleanPath.endsWith('.webp')) return 'image/webp';
  if (cleanPath.endsWith('.svg')) return 'image/svg+xml';
  if (cleanPath.endsWith('.ico')) return 'image/x-icon';
  if (cleanPath.endsWith('.data') || cleanPath.endsWith('.unityweb') || cleanPath.endsWith('.bin')) return 'application/octet-stream';
  if (cleanPath.endsWith('.mp3')) return 'audio/mpeg';
  if (cleanPath.endsWith('.ogg')) return 'audio/ogg';
  if (cleanPath.endsWith('.wav')) return 'audio/wav';
  if (cleanPath.endsWith('.woff2')) return 'font/woff2';
  if (cleanPath.endsWith('.woff')) return 'font/woff';
  if (cleanPath.endsWith('.ttf')) return 'font/ttf';
  if (cleanPath.endsWith('.otf')) return 'font/otf';

  if (headerType && headerType !== 'text/plain') {
    return headerType;
  }
  return 'text/html; charset=utf-8';
}

async function handleContentLoad(targetUrl: string, res: Response) {
  let url = targetUrl.trim();

  // If URL targets blocked jsdelivr user (e.g. genizy), map directly to raw.githubusercontent.com
  const genizyMatch = url.match(/https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/genizy\/([^/@]+)(?:@([^\/]+))?\/(.*)/i);
  if (genizyMatch) {
    const repo = genizyMatch[1];
    const branch = genizyMatch[2] && genizyMatch[2] !== 'latest' ? genizyMatch[2] : 'main';
    const filePath = genizyMatch[3];
    url = `https://raw.githubusercontent.com/genizy/${repo}/${branch}/${filePath}`;
  }

  const fetchWithFallback = async (currentUrl: string): Promise<{ response: globalThis.Response; finalUrl: string } | null> => {
    try {
      const resp = await fetch(currentUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      
      // If jsdelivr returned 403 (blocked repo/package size), attempt fallback to GitHub raw
      if (resp.status === 403 && currentUrl.includes('jsdelivr.net/gh/')) {
        const ghMatch = currentUrl.match(/https?:\/\/[^\/]+\.jsdelivr\.net\/gh\/([^/@]+)\/([^/@]+)(?:@([^\/]+))?\/(.*)/i);
        if (ghMatch) {
          const owner = ghMatch[1];
          const repo = ghMatch[2];
          const branch = ghMatch[3] && ghMatch[3] !== 'latest' ? ghMatch[3] : 'main';
          const rest = ghMatch[4];
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rest}`;
          const rawResp = await fetch(rawUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          if (rawResp.ok) {
            return { response: rawResp, finalUrl: rawUrl };
          }
        }
      }

      // If GitHub raw returned 404 with main branch, try master branch
      if (resp.status === 404 && currentUrl.includes('raw.githubusercontent.com/') && currentUrl.includes('/main/')) {
        const masterUrl = currentUrl.replace('/main/', '/master/');
        const masterResp = await fetch(masterUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (masterResp.ok) {
          return { response: masterResp, finalUrl: masterUrl };
        }
      }

      return { response: resp, finalUrl: currentUrl };
    } catch (e) {
      return null;
    }
  };

  const result = await fetchWithFallback(url);
  if (!result || !result.response.ok) {
    const status = result?.response?.status || 502;
    const statusText = result?.response?.statusText || "Fetch failed";
    return res.status(status).send(`Failed to fetch remote asset: ${statusText}`);
  }

  const { response, finalUrl } = result;
  const contentType = getMimeType(finalUrl, response.headers.get('content-type'));

  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  res.send(buffer);
}

// Server-side content loader for query format: /api/content-loader?url=...
router.get("/content-loader", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send("Missing url parameter");
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).send("Invalid URL protocol");
    }

    await handleContentLoad(url, res);
  } catch (err: any) {
    console.error("Content loader query error:", err);
    res.status(500).send(err.message || "Failed to fetch URL");
  }
});

// Path format support: /api/content-loader/raw.githubusercontent.com/... or /api/content-loader/https://...
router.get("/content-loader/*", async (req: Request, res: Response) => {
  try {
    const fullPath = req.params[0];
    if (!fullPath) {
      return res.status(400).send("Missing path parameter");
    }

    let url = fullPath;
    if (url.startsWith('http:/') && !url.startsWith('http://')) {
      url = url.replace('http:/', 'http://');
    } else if (url.startsWith('https:/') && !url.startsWith('https://')) {
      url = url.replace('https:/', 'https://');
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    await handleContentLoad(url, res);
  } catch (err: any) {
    console.error("Content loader path error:", err);
    res.status(500).send(err.message || "Failed to fetch URL path");
  }
});

export default router;
