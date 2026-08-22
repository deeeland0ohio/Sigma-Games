import express from "express";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import path from "path";
import fs from "fs";
import { diesmosGames } from "./src/data/diesmos";
import { defaultLuminGames } from "./src/data/lumin";
import { cvkGames } from "./src/data/cvk";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // b64:RW5hYmxlIGd6aXAgY29tcHJlc3Npb24gZm9yIGZhc3RlciB0cmFuc2ZlcnM=
  app.use(compression());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // b64:SGVscGVyIHRvIGZvcm1hdCByZWxhdGl2ZSB1cGxvYWQgZGF0ZXMgKGUuZy4sICIzIGRheXMgYWdvIiwgIjIgbW9udGhzIGFnbyIp
  function formatTimeAgo(dateInput: any): string {
    if (!dateInput) return "";
    let date: Date;
    if (typeof dateInput === "number") {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      const cleaned = String(dateInput).replace(/^(Streamed live on|Premiered on|Premiered)\s+/i, "").trim();
      date = new Date(cleaned);
    }

    if (isNaN(date.getTime())) {
      if (typeof dateInput === "string" && dateInput.toLowerCase().includes("ago")) return dateInput;
      return String(dateInput);
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0 || seconds < 60) return "Just now";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    
    const months = Math.floor(days / 30.4375);
    if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
    
    const years = Math.floor(days / 365.25);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }

  // b64:U2VydmVyLXNpZGUgRXZhc2lvbiBQcm94eSB0byBieXBhc3MgQ09SUyAmIENocm9tZSBCbG9ja2Vy
  app.get("/api/evasion-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).send("Missing url parameter");
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).send("Invalid URL protocol");
      }

      const proxyResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!proxyResponse.ok) {
        return res.status(proxyResponse.status).send(`Failed to fetch URL: ${proxyResponse.statusText}`);
      }

      const contentType = proxyResponse.headers.get('content-type') || 'text/html';
      res.setHeader('Content-Type', contentType);
      
      // b64:U3RyaXAgZnJhbWluZyByZXN0cmljdGlvbiBoZWFkZXJzIHNvIENocm9tZSB3b24ndCBibG9jayBlbWJlZGRpbmc=
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const text = await proxyResponse.text();
      res.send(text);
    } catch (err: any) {
      console.error("Evasion proxy error:", err);
      res.status(500).send(err.message || "Failed to fetch URL via proxy");
    }
  });

  // b64:LS0tIENIQVQgUk9PTSBSRUFMVElNRSBCQUNLRU5EIC0tLQ==
  const chatMessages: any[] = [];
  const activeBannedUserIds: Record<string, number> = {};
  const activeBannedNicknames: Record<string, number> = {};
  let sseClients: any[] = [];

  // b64:Q2hlY2sgd2hldGhlciBBYmx5IGlzIGNvbmZpZ3VyZWQgKGRpc2FibGVkIC8gcmVtb3ZlZCk=
  app.get("/api/ably-check", (req, res) => {
    res.json({
      configured: false
    });
  });

  // b64:RmFsbGJhY2sgU1NFIEVuZHBvaW50IGZvciBzZXJ2ZXItbmF0aXZlIHN0cmVhbWluZyAoMTAwJSBmcmVlLCB1bmxpbWl0ZWQsIG5vIEFQSSBrZXlzIHJlcXVpcmVkISk=
  app.get("/api/chat/sse", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { id: Math.random().toString(36), res };
    sseClients.push(client);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c.id !== client.id);
    });
  });

  // b64:QnJvYWRjYXN0IHJvdXRlciBmb3IgY2hhdCByb29tcyAoc2F2ZXMgaGlzdG9yeSBpbiBOb2RlIG1lbW9yeSBhbmQgcmVsYXlzIHZpYSBTU0Ugc3RyZWFtKQ==
  app.post("/api/chat/broadcast", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.type) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // b64:VXBkYXRlIGluLW1lbW9yeSBzdG9yYWdlIGJhc2VkIG9uIHRyYW5zYWN0aW9uIHR5cGVz
      if (payload.type === 'chat_message') {
        if (chatMessages.length >= 100) chatMessages.shift();
        chatMessages.push(payload);
      } else if (payload.type === 'message_deleted') {
        const idx = chatMessages.findIndex(m => m.id === payload.messageId);
        if (idx !== -1) {
          if (payload.isPermanentlyRemoved) {
            chatMessages.splice(idx, 1);
          } else if (payload.isAdminDeleted) {
            chatMessages[idx].isAdminDeleted = true;
          } else {
            chatMessages[idx].isDeleted = true;
          }
        }
      } else if (payload.type === 'user_kick') {
        if (payload.kickEnd) {
          activeBannedNicknames[payload.nickname.toLowerCase()] = payload.kickEnd;
          if (payload.targetUserId) {
            activeBannedUserIds[payload.targetUserId] = payload.kickEnd;
          }
        }
      }

      // b64:QnJvYWRjYXN0IHZpYSBpbnRlcm5hbCBTU0Ugc3RyZWFtIChzdXBwb3J0cyBpbnN0YW50LCB6ZXJvLWxpbWl0IGNvc3QtZnJlZSByZWFsdGltZSk=
      sseClients.forEach(c => {
        try {
          c.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch (e) {
          // clean up failed clients
        }
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error("Broadcast error:", err);
      res.status(500).json({ error: err.message || "Failed to broadcast event" });
    }
  });

  // b64:UmV0cmlldmUgbWVzc2FnZSBoaXN0b3J5ICYgY3VycmVudCBiYW4gc3RhdGVzIGZyb20gc2VydmVyIGNhY2hl
  app.get("/api/chat/history", (req, res) => {
    res.json({
      messages: chatMessages,
      bannedNicknames: activeBannedNicknames,
      bannedUserIds: activeBannedUserIds
    });
  });

  app.get("/api/youtube-search", async (req, res) => {
    try {
      const { query, page } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ results: [] });
      }

      const pageNum = parseInt(page as string) || 1;
      const bParams = pageNum > 1 ? { b: ((pageNum - 1) * 30 + 1).toString() } : {};

      const searchUrl =
        "https://video.search.yahoo.com/search/video?" +
        new URLSearchParams({
          p: query + " youtube",
          fr: "sfp",
          ...bParams
        });

      const searchResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html"
        }
      });

      if (!searchResponse.ok) {
        return res.status(200).json({ results: [] });
      }

      const html = await searchResponse.text();
      const cards = html.split('<li class="tile').slice(1);
      const results: any[] = [];
      const seen = new Set();
      const ids: string[] = [];

      for (const card of cards) {
        const refMatch = card.match(/data-referenceurl="([^"]+)"/);
        const hrefMatch = card.match(/href="([^"]+)"/);
        let url = refMatch?.[1] || hrefMatch?.[1];
        if (!url) continue;

        let idMatch = url.match(/v=([^&"]+)/);
        if (!idMatch) continue;

        let id = idMatch[1];
        if (!id || seen.has(id)) continue;

        seen.add(id);
        ids.push(id);
      }

      if (ids.length === 0) {
        return res.status(200).json({ results: [] });
      }

      for (const card of cards) {
        const refMatch = card.match(/data-referenceurl="([^"]+)"/);
        const hrefMatch = card.match(/href="([^"]+)"/);
        let url = refMatch?.[1] || hrefMatch?.[1];
        if (!url) continue;

        let idMatch = url.match(/v=([^&"]+)/);
        if (!idMatch) continue;

        let id = idMatch[1];
        if (!ids.includes(id)) continue;
        
        // b64:UmVtb3ZlIHNvIHdlIHByb2Nlc3MgZWFjaCB1bmlxdWUgSUQgb25seSBvbmNl
        ids.splice(ids.indexOf(id), 1);

        const titleMatch = card.match(/tile-title[^>]*>(.*?)<\/p>/s);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
          : "";

        const thumbMatch = card.match(/<img[^>]+src="([^"]+)"/);
        const thumbnail =
          thumbMatch?.[1] ||
          `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

        const durationMatch = card.match(/class="[^"]*time[^"]*"[^>]*>(.*?)<\/p>/);
        const duration = durationMatch?.[1]?.trim() || "unknown";

        const viewsMatch = card.match(/(\d[\d.,]*[MK]?) views/i);
        const views = viewsMatch?.[1] || "unknown";

        const channelMatch = card.match(/tile-domain[^>]*>(.*?)<\/p>/);
        let channel = channelMatch
          ? channelMatch[1].replace(/<[^>]+>/g, "").trim()
          : "YouTube";

        results.push({
          id,
          title,
          thumbnail,
          duration,
          views,
          channel,
          uploadedAgo: ""
        });
      }

      // b64:RmV0Y2ggYWNjdXJhdGUgY2hhbm5lbCBuYW1lcywgdGl0bGVzIGFuZCB1cGxvYWQgZGF0ZXMgaW4gcGFyYWxsZWw=
      await Promise.all(
        results.map(async (item) => {
          try {
            const [embedRes, watchRes] = await Promise.all([
              fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${item.id}&format=json`).catch(() => null),
              fetch(`https://www.youtube.com/watch?v=${item.id}`, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  "Accept-Language": "en-US,en;q=0.9"
                }
              }).catch(() => null)
            ]);

            if (embedRes && embedRes.ok) {
              const data = await embedRes.json();
              if (data.author_name) item.channel = data.author_name;
              if (data.title) item.title = data.title;
            }

            if (watchRes && watchRes.ok) {
              const text = await watchRes.text();
              const dateMatch = text.match(/"dateText":\{"simpleText":"([^"]+)"\}/)?.[1] ||
                                text.match(/"uploadDate":"([^"]+)"/)?.[1] ||
                                text.match(/"publishDate":"([^"]+)"/)?.[1] ||
                                text.match(/itemprop="datePublished" content="([^"]+)"/)?.[1];
              if (dateMatch) {
                item.uploadedAgo = formatTimeAgo(dateMatch);
              }
              if (!item.channel || item.channel === "YouTube") {
                const authorMatch = text.match(/"ownerChannelName":"([^"]+)"/)?.[1] ||
                                    text.match(/"author":"([^"]+)"/)?.[1];
                if (authorMatch) item.channel = authorMatch;
              }
            }
          } catch (e) {
            // Error silently, fall back to scraped data
          }
        })
      );

      res.status(200).json({ results });
    } catch (e: any) {
      console.error("Youtube API error:", e);
      res.status(500).json({ results: [] });
    }
  });

  app.get("/api/tiktok-search", async (req, res) => {
    try {
      const { query, page } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ results: [] });
      }

      const pageNum = parseInt(page as string) || 1;
      const bParams = pageNum > 1 ? { b: ((pageNum - 1) * 30 + 1).toString() } : {};

      const searchUrl =
        "https://video.search.yahoo.com/search/video?" +
        new URLSearchParams({
          p: query + " site:tiktok.com",
          fr: "sfp",
          ...bParams
        });

      const searchResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html"
        }
      });

      if (!searchResponse.ok) {
        return res.status(200).json({ results: [] });
      }

      const html = await searchResponse.text();
      const cards = html.split('<li class="tile').slice(1);
      const results: any[] = [];
      const seen = new Set();

      for (const card of cards) {
        const refMatch = card.match(/data-referenceurl="([^"]+)"/);
        const hrefMatch = card.match(/href="([^"]+)"/);
        let url = refMatch?.[1] || hrefMatch?.[1];
        if (!url) continue;

        let decodedUrl = "";
        try {
          decodedUrl = decodeURIComponent(url);
        } catch(e) {
          decodedUrl = url;
        }

        // b64:TWF0Y2g6IHRpa3Rvay5jb20vQHVzZXJuYW1lL3ZpZGVvLzEyMzQ1Njc4OTA=
        const tiktokMatch = decodedUrl.match(/tiktok\.com\/@([^\/]+)\/video\/(\d+)/i);
        if (!tiktokMatch) continue;

        const username = tiktokMatch[1];
        const id = tiktokMatch[2];

        if (seen.has(id)) continue;
        seen.add(id);

        const titleMatch = card.match(/tile-title[^>]*>(.*?)<\/p>/s);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
          : `TikTok by @${username}`;

        const thumbMatch = card.match(/<img[^>]+src="([^"]+)"/);
        const thumbnail = thumbMatch?.[1] || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60";

        const durationMatch = card.match(/class="[^"]*time[^"]*"[^>]*>(.*?)<\/p>/);
        const duration = durationMatch?.[1]?.trim() || "";

        const viewsMatch = card.match(/(\d[\d.,]*[MK]?) views/i);
        const views = viewsMatch?.[1] || "unknown";

        let uploadedAgo = "";
        try {
          // b64:VGlrVG9rIDY0LWJpdCBzbm93Zmxha2UgSURzIGVuY29kZSB0aW1lc3RhbXAgaW4gdXBwZXIgMzIgYml0cw==
          const timeSec = Number(BigInt(id) >> 32n);
          if (!isNaN(timeSec) && timeSec > 0) {
            uploadedAgo = formatTimeAgo(timeSec * 1000);
          }
        } catch (e) {}

        results.push({
          id,
          username,
          title,
          thumbnail,
          duration,
          views,
          channel: `@${username}`,
          uploadedAgo
        });
      }

      res.status(200).json({ results });
    } catch (e: any) {
      console.error("TikTok API error:", e);
      res.status(500).json({ results: [] });
    }
  });

  // b64:QVBJIGVuZHBvaW50IGZvciBnYW1lIGxpYnJhcmllcyB0byBzdXBwb3J0IHN0YXRpYyB1bmJsb2NrZWQgbG9hZGVycw==
  app.get("/api/diesmos-games", (req, res) => {
    res.json(diesmosGames);
  });

  app.get("/api/lumin-games", (req, res) => {
    res.json(defaultLuminGames);
  });

  app.get("/api/cvk-games", (req, res) => {
    res.json(cvkGames);
  });

  // b64:SW50ZXJjZXB0IGdhbWUgSFRNTCB0byBpbmplY3QgbG9jYWxTdG9yYWdlIG1vY2sgdG8gcHJldmVudCBjcmFzaGVzIGluIGJsb2I6bnVsbA==
  app.get("/games/*/index.html", async (req, res, next) => {
    try {
      // b64:RGVjb2RlIHRoZSBVUkwgcGF0aCB0byBoYW5kbGUgYW55IHNwYWNlcyBvciBzcGVjaWFsIGNoYXJhY3RlcnM=
      const filePath = path.join(process.cwd(), 'public', decodeURIComponent(req.path));
      if (fs.existsSync(filePath)) {
        let html = await fs.promises.readFile(filePath, 'utf-8');
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
        
        if (html.includes('<head>')) {
          html = html.replace('<head>', '<head>\\n' + mockScript);
        } else {
          html = mockScript + html;
        }
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        return;
      }
    } catch(err) {
      console.error(err);
    }
    next();
  });

  // b64:U2VydmUgc3RhdGljLmh0bWwgYW5kIHN0YXRpYy5zdmcgZGlyZWN0bHkgZnJvbSB3b3Jrc3BhY2Ugcm9vdA==
  app.get("/static.html", (req, res) => {
    res.sendFile(path.join(process.cwd(), "static.html"));
  });

  app.get("/static.svg", (req, res) => {
    res.sendFile(path.join(process.cwd(), "static.svg"));
  });

  // b64:S2VlcCBjb21wYXRpYmlsaXR5IGZvciAvc2lnbWFzdGF0aWM=
  app.get("/sigmastatic", (req, res) => {
    res.sendFile(path.join(process.cwd(), "static.html"));
  });

  // b64:U2VydmUgcHVibGljIGRpcmVjdG9yeSBkaXJlY3RseSBmb3IgbWF4aW11bSBzcGVlZCBvbiBsb2NhbCBnYW1lcw==
  // b64:VGhpcyBieXBhc3NlcyBWaXRlJ3MgcHJvY2Vzc2luZyBmb3IgbGFyZ2Ugc3RhdGljIEhUTUwgZmlsZXM=
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  // b64:UHJldmVudCBtaXNzaW5nIGxvY2FsIGdhbWUgYXNzZXRzIGZyb20gaGl0dGluZyBWaXRlIG1pZGRsZXdhcmUgYW5kIGNyYXNoaW5nIHRoZSBzZXJ2ZXI=
  app.use('/games', (req, res) => {
    res.status(404).send('Game asset not found');
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
