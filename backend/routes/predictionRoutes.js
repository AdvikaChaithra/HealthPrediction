// backend/routes/predictionRoutes.js
import express from "express";
import { predict, getHistory } from "../controllers/predictionController.js";
import { getSchema as fetchSchema } from "../utils/mlService.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ Auth middleware — attaches userId to req
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // 🔥 attach userId from JWT payload
    next();
  } catch (err) {
    console.error("❌ JWT Error:", err.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// --- Routes ---
router.post("/", verifyToken, predict);

// ✅ Filtered history: Only user’s own predictions
router.get("/history", verifyToken, getHistory);

// Optional: Fetch ML schema
router.get("/schema", async (req, res) => {
  try {
    const data = await fetchSchema();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
