import { Router } from "express";
import { diesmosGames } from "../../src/sources/diesmos";
import { defaultLuminGames } from "../../src/sources/lumin";
import { cvkGames } from "../../src/sources/cvk";

const router = Router();

// API endpoints for game libraries to support static unblocked loaders
router.get("/diesmos-games", (req, res) => {
  res.json(diesmosGames);
});

router.get("/lumin-games", (req, res) => {
  res.json(defaultLuminGames);
});

router.get("/cvk-games", (req, res) => {
  res.json(cvkGames);
});

export default router;
