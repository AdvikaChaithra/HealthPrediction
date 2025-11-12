// backend/models/History.js
import mongoose from "mongoose";

// Sub-schema for storing the form snapshot (user-entered info)
const FormSnapshotSchema = new mongoose.Schema(
  {
    age: { type: Number, min: 0, max: 150 },
    sex: { type: String, enum: ["Male", "Female", "Other"], default: "" },
    diet_type: { type: String, default: "" },
    smoking_history: { type: String, default: "" },
    physical_activity: { type: String, default: "" },
    symptoms_text: { type: String, default: "" }, // stores user-entered symptoms
  },
  { _id: false }
);

// Main schema for prediction history
const HistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Human-readable data snapshot (entered in the form)
    form: { type: FormSnapshotSchema, required: true },

    // ML-ready features that were actually sent to the model
    features: { type: Object, required: true },

    // Prediction results
    prediction: { type: String, required: true, index: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },

    // Optional explainability data (e.g. SHAP values)
    explanation: { type: Object, default: null },

    // ✅ NEW FIELD: Disease advice (for user-friendly suggestions)
    advice: {
      type: {
        short: { type: String }, // 1-line summary
        avoid: { type: [String] }, // list of things to avoid
        do: { type: [String] }, // list of things to intake or follow
        urgent: { type: Boolean, default: false }, // if doctor visit is urgent
        notes: { type: String }, // optional additional description
      },
      default: null,
    },
  },
  { timestamps: true }
);

// Index for quick history fetch per user
HistorySchema.index({ userId: 1, createdAt: -1 });

// Export model
export default mongoose.model("History", HistorySchema, "histories");
