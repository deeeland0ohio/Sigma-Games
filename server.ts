import express from "express";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable gzip compression for faster transfers
  app.use(compression());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
