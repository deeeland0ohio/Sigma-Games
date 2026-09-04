import { Router } from "express";

const router = Router();

// Helper to format relative upload dates (e.g., "3 days ago", "2 months ago")
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

// YouTube Search API
router.get("/youtube-search", async (req, res) => {
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
        channel,
        uploadedAgo: ""
      });
    }

    // Fetch accurate channel names, titles and upload dates in parallel
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

// TikTok Search API
router.get("/tiktok-search", async (req, res) => {
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

      let uploadedAgo = "";
      try {
        // TikTok 64-bit snowflake IDs encode timestamp in upper 32 bits
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

export default router;
