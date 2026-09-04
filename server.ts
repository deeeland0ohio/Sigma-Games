import express from "express";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import path from "path";
import apiRouter from "./server/routes/index";
import { gameAssetInterceptor } from "./server/middleware/gameAssetInterceptor";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(compression());
  app.use(express.json());

  // Modular API Routes
  app.use("/api", apiRouter);

  // Intercept local game HTML to inject storage polyfill & fix CDN hashes
  app.get("/games/*/index.html", gameAssetInterceptor);

  // Serve static fallback files directly from workspace root
  app.get("/static.html", (req, res) => {
    res.sendFile(path.join(process.cwd(), "static.html"));
  });

  app.get("/static.svg", (req, res) => {
    res.sendFile(path.join(process.cwd(), "static.svg"));
  });

  // Compatibility route for /sigmastatic
  app.get("/sigmastatic", (req, res) => {
    res.sendFile(path.join(process.cwd(), "static.html"));
  });

  // Serve public directory directly for maximum speed on local games
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  // Prevent missing local game assets from hitting Vite middleware
  app.use('/games', (req, res) => {
    res.status(404).send('Not Found');
  });

  // Vite development middleware vs production static handler
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
