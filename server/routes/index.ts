import { Router } from "express";
import contentLoaderRouter from "./contentLoader";
import chatRouter from "./chat";
import mediaRouter from "./media";
import gamesRouter from "./games";

const apiRouter = Router();

// Health check
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mount module routers
apiRouter.use(contentLoaderRouter);
apiRouter.use(chatRouter);
apiRouter.use(mediaRouter);
apiRouter.use(gamesRouter);

export default apiRouter;
