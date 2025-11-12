// backend/models/History.js
import mongoose from "mongoose";

// --- Sub-schema for user-entered data ---
const FormSnapshotSchema = new mongoose.Schema(
  {
    age: { type: Number, min: 0, max: 150 },
    sex: { type: String, enum: ["Male", "Female", "Other"], default: "" },
    diet_type: { type: String, default: "" },
    smoking_history: { type: String, default: "" },
    physical_activity: { type: String, default: "" },
    symptoms_text: { type: String, default: "" }, // User-entered symptom text
  },
  { _id: false }
);

// --- Advice schema for richer health guidance ---
const AdviceSchema = new mongoose.Schema(
  {
    short: { type: String, default: "" },
    avoid: { type: [String], default: [] },
    do: { type: [String], default: [] },
    prevention: { type: [String], default: [] },
    nutrition: {
      recommended: { type: [String], default: [] },
      avoid: { type: [String], default: [] },
    },
    urgent: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

// --- Main schema ---
const HistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    form: { type: FormSnapshotSchema, required: true }, // readable snapshot
    features: { type: Object, required: true }, // one-hot encoded inputs

    prediction: { type: String, required: true, index: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    explanation: { type: Object, default: null },

    // ✅ Full structured advice info
    advice: { type: AdviceSchema, default: null },
  },
  { timestamps: true }
);

// helpful index
HistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("History", HistorySchema, "histories");
