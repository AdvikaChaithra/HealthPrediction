//backend/models/history.js
import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  features: { type: Object, required: true },
  prediction: { type: String, required: true },
  confidence: { type: Number, required: true },
  explanation: { type: Object },
}, { timestamps: true });

export default mongoose.model("History", historySchema);
