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

  // Real-time server-side Chat Engine
  interface ChatMessage {
    id: string;
    text: string;
    senderName: string;
    senderId: string;
    createdAt: number;
    os: string;
    isDeleted?: boolean;
    isPlaceholder?: boolean;
    isAdminDeleted?: boolean;
    isPermanentlyRemoved?: boolean;
  }

  interface ActiveUser {
    id: string;
    nickname: string;
    lastActive: number;
    isTyping: boolean;
    isOwner: boolean;
    os: string;
  }

  let chatMessages: ChatMessage[] = [];
  let chatUsers: Record<string, ActiveUser> = {};
  let sseClients: { id: string; res: express.Response }[] = [];

  function broadcastChatEvent(payload: any) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.res.write(data);
      } catch (err) {
        // Safe check for closed client connections
      }
    });
  }

  function pruneInactiveAndOldState() {
    const now = Date.now();
    // Auto-clear messages older than 2 hours (7,200,000 ms)
    const oldLength = chatMessages.length;
    chatMessages = chatMessages.filter(msg => now - msg.createdAt < 7200000);
    
    // Heartbeat check: remove users inactive for more than 15 seconds
    let changed = false;
    for (const [id, user] of Object.entries(chatUsers)) {
      if (now - user.lastActive > 15000) {
        delete chatUsers[id];
        changed = true;
      }
    }

    if (changed) {
      broadcastChatEvent({ type: "presence_list", users: Object.values(chatUsers) });
    }
  }

  setInterval(pruneInactiveAndOldState, 10000);

  // Chat API Endpoints
  app.get("/api/chat/stream", (req, res) => {
    const { userId, nickname, isOwner, os } = req.query;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    res.write("\n");

    const clientId = (userId as string) || `u_${Math.random().toString(36).substring(2, 11)}`;

    if (nickname && typeof nickname === "string") {
      chatUsers[clientId] = {
        id: clientId,
        nickname,
        lastActive: Date.now(),
        isTyping: false,
        isOwner: isOwner === "true",
        os: (os as string) || "Unknown"
      };
      // Short delay, then broadcast updated presence list
      setTimeout(() => {
        broadcastChatEvent({ type: "presence_list", users: Object.values(chatUsers) });
      }, 100);
    }

    sseClients.push({ id: clientId, res });

    // Instantly bootstrap new clients with cached last 2h history
    res.write(`data: ${JSON.stringify({ type: "bootstrap", messages: chatMessages, users: Object.values(chatUsers) })}\n\n`);

    req.on("close", () => {
      sseClients = sseClients.filter(c => c.res !== res);
      if (chatUsers[clientId]) {
        delete chatUsers[clientId];
        broadcastChatEvent({ type: "presence_list", users: Object.values(chatUsers) });
      }
    });
  });

  app.post("/api/chat/presence", (req, res) => {
    const { id, nickname, isTyping, isOwner, os } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Missing user identifier" });
    }

    chatUsers[id] = {
      id,
      nickname: nickname || "Guest",
      lastActive: Date.now(),
      isTyping: !!isTyping,
      isOwner: !!isOwner,
      os: os || "Unknown"
    };

    broadcastChatEvent({ type: "presence_list", users: Object.values(chatUsers) });
    res.json({ success: true });
  });

  app.post("/api/chat/send", (req, res) => {
    const { id, text, senderName, senderId, createdAt, os } = req.body;
    if (!text || !senderName) {
      return res.status(400).json({ error: "Missing message details" });
    }

    const message: ChatMessage = {
      id: id || Math.random().toString(36).substring(2, 11),
      text,
      senderName,
      senderId,
      createdAt: createdAt || Date.now(),
      os: os || "Unknown"
    };

    chatMessages.push(message);
    broadcastChatEvent({ type: "chat_message", message });
    res.json({ success: true, message });
  });

  app.post("/api/chat/delete", (req, res) => {
    const { messageId, isPermanentlyRemoved, isAdminDeleted } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: "Missing message identifier" });
    }

    chatMessages = chatMessages.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          isDeleted: true,
          isPlaceholder: !isPermanentlyRemoved,
          isAdminDeleted: !!isAdminDeleted,
          isPermanentlyRemoved: !!isPermanentlyRemoved
        };
      }
      return msg;
    });

    broadcastChatEvent({
      type: "message_deleted",
      messageId,
      isPermanentlyRemoved: !!isPermanentlyRemoved,
      isAdminDeleted: !!isAdminDeleted
    });

    res.json({ success: true });
  });

  app.post("/api/chat/kick", (req, res) => {
    const { nickname, kickType, kickEnd, adminId } = req.body;
    if (!nickname) {
      return res.status(400).json({ error: "Missing nickname parameters" });
    }

    broadcastChatEvent({
      type: "user_kick",
      nickname,
      kickType: kickType || "soft",
      kickEnd: kickEnd || 0,
      adminId
    });

    res.json({ success: true });
  });

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
