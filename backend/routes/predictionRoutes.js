//backend/routes/predictionRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import { predict, getHistory } from "../controllers/predictionController.js";
import { getSchema as fetchSchema } from "../utils/mlService.js"; // 👈 ADD THIS

const router = express.Router();

// Auth middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

router.post("/", verifyToken, predict);
router.get("/history", verifyToken, getHistory);

// 👇 NEW: Route for fetching ML schema
router.get("/schema", async (req, res) => {
  try {
    const data = await fetchSchema();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
