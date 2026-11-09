// backend/app.js
// Load .env BEFORE any other module reads process.env (ES imports are hoisted,
// so calling dotenv.config() in the body would run too late for utils/mlService.js).
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./utils/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import userRoutes from "./routes/userRoutes.js";

for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key} (set it in backend/.env)`);
    process.exit(1);
  }
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/user", userRoutes);

// 404 for unknown API routes
app.use((req, res) => res.status(404).json({ message: "Not found" }));

// Central error handler (e.g. malformed JSON bodies)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: status === 500 ? "Internal server error" : err.message });
});

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
