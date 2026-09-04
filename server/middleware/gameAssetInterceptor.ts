import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Intercept game HTML to inject localStorage / sessionStorage mock polyfills
// and rewrite old commit hashes to prevent crashes
export async function gameAssetInterceptor(req: Request, res: Response, next: NextFunction) {
  try {
    const filePath = path.join(process.cwd(), 'public', decodeURIComponent(req.path));
    if (fs.existsSync(filePath)) {
      let html = await fs.promises.readFile(filePath, 'utf-8');
      
      // Switch gn-math to freebuisness & normalize hashes
      html = html.replace(/\/gh\/gn-math\//gi, '/gh/freebuisness/');
      html = html.replace(
        /(https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/(?:aDiesmos|WanoCapy|3kh0|a456pur|greenday894|HydroXide1|Noah-Is-Awesome|alexr-hub|bubbls|lonya-k|degloved-net|freebuisness)\/([a-zA-Z0-9_-]+))@[a-zA-Z0-9_.-]+(\/|$)/g,
        '$1@main$3'
      );

      // Map blocked jsdelivr genizy repositories to content-loader proxy
      html = html.replace(
        /https?:\/\/(?:testingcf|fastly|cdn|quantil)\.jsdelivr\.net\/gh\/genizy\/([^/@]+)(?:@([^\/'" >]+))?\//gi,
        (_match, repo, branch) => {
          const b = branch && branch !== 'latest' ? branch : 'main';
          return `/api/content-loader/raw.githubusercontent.com/genizy/${repo}/${b}/`;
        }
      );

      const mockScript = `<script>
        (function() {
          var mem = {};
          var sessionMem = {};
          try {
            window.localStorage.getItem('test');
          } catch(e) {
            try {
              Object.defineProperty(window, 'localStorage', {
                value: {
                  getItem: function(k) { return mem[k] || null; },
                  setItem: function(k, v) { mem[k] = v; },
                  removeItem: function(k) { delete mem[k]; },
                  clear: function() { mem = {}; },
                  key: function(i) { return Object.keys(mem)[i] || null; },
                  get length() { return Object.keys(mem).length; }
                },
                writable: true
              });
              Object.defineProperty(window, 'sessionStorage', {
                value: {
                  getItem: function(k) { return sessionMem[k] || null; },
                  setItem: function(k, v) { sessionMem[k] = v; },
                  removeItem: function(k) { delete sessionMem[k]; },
                  clear: function() { sessionMem = {}; },
                  key: function(i) { return Object.keys(sessionMem)[i] || null; },
                  get length() { return Object.keys(sessionMem).length; }
                },
                writable: true
              });
            } catch(err) {}
          }
        })();
      </script>`;

      // Inject base tag if not present so relative paths resolve correctly
      if (!html.includes('<base ')) {
        const gameDir = req.path.substring(0, req.path.lastIndexOf('/') + 1);
        const baseTag = `<base href="${gameDir}">`;
        if (html.includes('<head>')) {
          html = html.replace('<head>', '<head>\n' + baseTag + '\n' + mockScript);
        } else {
          html = baseTag + '\n' + mockScript + '\n' + html;
        }
      } else {
        if (html.includes('<head>')) {
          html = html.replace('<head>', '<head>\n' + mockScript);
        } else {
          html = mockScript + html;
        }
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
  } catch (err) {
    console.error("Game asset interceptor error:", err);
  }
  next();
}
