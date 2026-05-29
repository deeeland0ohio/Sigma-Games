import express from "express";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable gzip compression for faster transfers
  app.use(compression());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
        
        // Remove so we process each unique ID only once
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
          channel
        });
      }

      // Fetch accurate channel names from oEmbed API in parallel
      await Promise.all(
        results.map(async (item) => {
          try {
            const embedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${item.id}&format=json`);
            if (embedRes.ok) {
              const data = await embedRes.json();
              if (data.author_name) item.channel = data.author_name;
              if (data.title) item.title = data.title; // sometimes oembed provides an un-truncated, cleaner title
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

        // Match: tiktok.com/@username/video/1234567890
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

        results.push({
          id,
          username,
          title,
          thumbnail,
          duration,
          views,
          channel: `@${username}`
        });
      }

      res.status(200).json({ results });
    } catch (e: any) {
      console.error("TikTok API error:", e);
      res.status(500).json({ results: [] });
    }
  });

  // Serve public directory directly for maximum speed on local games
  // This bypasses Vite's processing for large static HTML files
  app.use(express.static(path.join(process.cwd(), 'public')));

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
