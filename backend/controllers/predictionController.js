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

    // ✅ Convert symptoms text → binary flags
    const symptomList = features.symptoms
      ? features.symptoms
          .split(/\s|,|;/) // split by space or comma
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const symptomKeys = [
      "Back Pain", "Bleeding Gums", "Blurred Vision", "Body Ache", "Chest Pain",
      "Cold Hands", "Cough", "Dizziness", "Fatigue", "Fever",
      "Frequent Urination", "Headache", "High Fever", "Increased Thirst",
      "Irregular Heartbeat", "Itching", "Joint Pain", "Loss of Smell",
      "Nausea", "Pale Skin", "Rash", "Shortness of Breath", "Slow Healing",
      "Sore Throat", "Sweating", "Swelling", "Weakness", "Weight Loss"
    ];

    // 🔧 Convert user’s symptoms to 1/0 features for the model
    symptomKeys.forEach(key => {
      mappedFeatures[key] = symptomList.includes(key.toLowerCase()) ? 1 : 0;
    });

    console.log("🧠 Final mappedFeatures:", mappedFeatures);

    // ✅ Call Flask ML API
    const result = await predictDisease(mappedFeatures);

    console.log("✅ Flask Response:", result);

    // ✅ Save prediction history to MongoDB
    const historyEntry = await History.create({
      userId,
      features: mappedFeatures,
      prediction: result.prediction,
      confidence: result.confidence,
      explanation: result.explanation,
    });

    // ✅ Return combined result to frontend
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
