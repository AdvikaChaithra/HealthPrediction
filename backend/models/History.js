// backend/models/History.js
import mongoose from "mongoose";

const FormSnapshotSchema = new mongoose.Schema(
  {
    age: { type: Number, min: 0, max: 150 },
    sex: { type: String, enum: ["Male", "Female", "Other"] },
    diet_type: { type: String },
    smoking_history: { type: String },
    physical_activity: { type: String },
    symptoms_text: { type: String, default: "" }, // <-- stores user-entered symptoms
  },
  { _id: false }
);

const HistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    form: { type: FormSnapshotSchema, required: true }, // human-readable snapshot
    features: { type: Object, required: true },          // ML-ready one-hot vector
    prediction: { type: String, required: true, index: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    explanation: { type: Object, default: null },
  },
  { timestamps: true }
);

HistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("History", HistorySchema, "histories");
