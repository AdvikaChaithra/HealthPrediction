// backend/controllers/predictionController.js 
import History from "../models/History.js";
import { predictDisease } from "../utils/mlService.js";
import diseaseAdvice from "../config/diseaseAdvice.js";

// Helper to normalize text for consistent lookups
const normalize = (text) =>
  (text || "")
    .toString()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const predict = async (req, res) => {
  try {
    const { features } = req.body;
    const userId = req.userId; // 👈 comes from verifyToken

    // --- Store user-friendly snapshot ---
    const formSnapshot = {
      age: Number(features.age) || null,
      sex: features.sex || "",
      diet_type: features.diet_type || "",
      smoking_history: features.smoking_history || "",
      physical_activity: features.physical_activity || "",
      symptoms_text: (features.symptoms || "").trim(),
    };

    // --- Build ML-ready features ---
    const mappedFeatures = {
      Age: formSnapshot.age,
      Sex: formSnapshot.sex,
      SmokingHistory: formSnapshot.smoking_history,
      DietType: formSnapshot.diet_type,
      ExerciseFrequency: formSnapshot.physical_activity,
    };

    // --- Process symptoms ---
    const symptomList = formSnapshot.symptoms_text
      ? formSnapshot.symptoms_text
          .split(/[,;\n]+/)
          .map((s) => normalize(s))
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

    symptomKeys.forEach((key) => {
      const nk = normalize(key);
      mappedFeatures[key] = symptomList.includes(nk) ? 1 : 0;
    });

    // --- Get prediction from ML model ---
    const result = await predictDisease(mappedFeatures);
    const predicted = (result.prediction || "Unknown").trim();

    // --- Find advice (case-insensitive lookup) ---
    const adviceKey = normalize(predicted);
    const advice =
      diseaseAdvice[adviceKey] ||
      diseaseAdvice[predicted] ||
      diseaseAdvice["default"] || {
        short: "No specific guidance available.",
        avoid: [],
        do: ["Consult a healthcare provider for personalized advice."],
        prevention: [],
        nutrition: { recommended: [], avoid: [] },
        urgent: false,
        notes: "",
      };

    // --- Save to MongoDB ---
    const historyEntry = await History.create({
      userId,
      form: formSnapshot,
      features: mappedFeatures,
      prediction: predicted,
      confidence: result.confidence ?? 0,
      explanation: result.explanation ?? null,
      advice,
    });

    // --- Send back full result with advice ---
    res.json({
      ...result,
      prediction: predicted,
      historyId: historyEntry._id,
      advice,
    });
  } catch (err) {
    console.error("❌ Prediction Error:", err);
    res.status(500).json({ message: err.message || "Prediction failed" });
  }
};

// ✅ Fetch user’s full prediction history
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const history = await History.find({ userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ History Fetch Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
