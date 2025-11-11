
/**
 * mongo_setup.js
 * One-time MongoDB bootstrap script: creates DB, collections, indexes, and seed admin.
 * Run:
 *   node mongo_setup.js
 * Environment:
 *   MONGO_URI=mongodb://127.0.0.1:27017/ai_health_db
 */
import mongoose from "mongoose";
import * as readline from "readline";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_health_db";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

(async () => {
  try {
    console.log("Connecting to:", MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Connected.");

    // Define collections (minimal schemas for setup)
    const userSchema = new mongoose.Schema({
      name: String, age: Number, sex: String, email: { type: String, unique: true }, password: String
    }, { timestamps: true });
    const historySchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      features: Object, prediction: String, confidence: Number, explanation: Object
    }, { timestamps: true });

    const User = mongoose.model("User", userSchema, "users");
    const History = mongoose.model("History", historySchema, "history");

    // Create indexes (idempotent)
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await History.collection.createIndex({ userId: 1, createdAt: -1 });

    console.log("✅ Indexes ensured.");

    // Optionally seed an admin/test user
    rl.question("Seed a test user? (y/N): ", async (ans) => {
      if (String(ans).toLowerCase() === "y") {
        const exists = await User.findOne({ email: "admin@health.ai" });
        if (!exists) {
          const bcrypt = await import("bcryptjs");
          const hashed = await bcrypt.default.hash("Admin@123", 10);
          await User.create({
            name: "Admin",
            age: 25,
            sex: "Female",
            email: "admin@health.ai",
            password: hashed
          });
          console.log("✅ Seeded test user: admin@health.ai / Admin@123");
        } else {
          console.log("ℹ️ Test user already exists.");
        }
      } else {
        console.log("Skipping seeding.");
      }
      await mongoose.disconnect();
      rl.close();
      console.log("✅ Setup complete.");
    });

  } catch (err) {
    console.error("❌ Setup error:", err.message);
    process.exit(1);
  }
})();
