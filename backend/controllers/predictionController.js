//backend/controllers/predictionController.js
import History from "../models/History.js";
import { predictDisease } from "../utils/mlService.js";

export const predict = async (req, res) => {
  try {
    const { features } = req.body;
    const userId = req.userId || null;

    // ✅ Map frontend → ML expected keys
    const mappedFeatures = {
      Age: features.age,
      Sex: features.sex,
      SmokingHistory: features.smoking_history,
      DietType: features.diet_type,
      ExerciseFrequency: features.physical_activity,
    };

    // ✅ Normalize helper (removes spaces, hyphens, underscores)
    const normalize = (text) =>
      text.toLowerCase().replace(/[\s\-_]+/g, "").trim();

    // ✅ Convert user symptom input into normalized list
    const symptomList = features.symptoms
      ? features.symptoms
          .toLowerCase()
          .split(/[,;]+|\n+/) // split by commas, semicolons, or newlines
          .map((s) =>
            s
              .trim()
              .replace(/[-_]+/g, " ") // join words like weight-loss → weight loss
              .replace(/\s+/g, " ")   // collapse multiple spaces
          )
          .filter(Boolean)
      : [];

    // ✅ All possible model feature keys (must match your ML model)
    const symptomKeys = [
      "Back Pain", "Bleeding Gums", "Blurred Vision", "Body Ache", "Chest Pain",
      "Cold Hands", "Cough", "Dizziness", "Fatigue", "Fever",
      "Frequent Urination", "Headache", "High Fever", "Increased Thirst",
      "Irregular Heartbeat", "Itching", "Joint Pain", "Loss of Smell",
      "Nausea", "Pale Skin", "Rash", "Shortness of Breath", "Slow Healing",
      "Sore Throat", "Sweating", "Swelling", "Weakness", "Weight Loss"
    ];

    // ✅ Detect symptom presence (matches even without spaces)
    symptomKeys.forEach((key) => {
      const normalizedKey = normalize(key); // e.g. "Weight Loss" → "weightloss"
      mappedFeatures[key] = symptomList.some(
        (s) => normalize(s) === normalizedKey
      )
        ? 1
        : 0;
    });

    console.log("🧠 Final mappedFeatures:", mappedFeatures);

    // ✅ Send features to Flask ML API
    const result = await predictDisease(mappedFeatures);
    console.log("✅ Flask Response:", result);

    // ✅ Save prediction history (include original symptom text)
const historyEntry = await History.create({
  userId,
  features: {
    ...mappedFeatures,
    symptoms: features.symptoms || "", // 👈 store user's raw symptom input
  },
  prediction: result.prediction,
  confidence: result.confidence,
  explanation: result.explanation,
});

    // ✅ Return response to frontend
    res.json({ ...result, historyId: historyEntry._id });
  } catch (err) {
    console.error("❌ Prediction Error:", err.message);
    if (err.response) console.error("Flask Error:", err.response.data);
    res.status(500).json({ message: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const history = await History.find({ userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
