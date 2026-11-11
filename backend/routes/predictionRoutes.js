// backend/routes/predictionRoutes.js
import express from "express";
import { predict, getHistory } from "../controllers/predictionController.js";
import { getSchema as fetchSchema } from "../utils/mlService.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, predict);

// Only the logged-in user's own predictions
router.get("/history", verifyToken, getHistory);

// Proxy the ML schema (feature lists, categories, classes)
router.get("/schema", async (req, res) => {
  try {
    const data = await fetchSchema();
    res.json(data);
  } catch (e) {
    res.status(502).json({ message: `ML service unavailable: ${e.message}` });
  }
});

export default router;
