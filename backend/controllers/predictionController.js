// backend/controllers/predictionController.js
import History from "../models/History.js";
import { predictDisease } from "../utils/mlService.js";
import diseaseAdvice from "../config/diseaseAdvice.js"; // NEW — advice mapping

// Helper function to normalize symptom text
const normalize = (text) =>
  (text || "")
    .toString()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const predict = async (req, res) => {
  try {
    const { features } = req.body; // raw frontend form data
    const userId = req.userId || null;

    // --- Store the exact user input (human-readable form) ---
    const formSnapshot = {
      age: Number(features.age) || null,
      sex: features.sex || "",
      diet_type: features.diet_type || "",
      smoking_history: features.smoking_history || "",
      physical_activity: features.physical_activity || "",
      symptoms_text: (features.symptoms || "").trim(),
    };

    // --- Prepare ML-ready features ---
    const mappedFeatures = {
      Age: formSnapshot.age,
      Sex: formSnapshot.sex,
      SmokingHistory: formSnapshot.smoking_history,
      DietType: formSnapshot.diet_type,
      ExerciseFrequency: formSnapshot.physical_activity,
    };

    // --- Convert user-entered symptoms into model features ---
    const symptomList = formSnapshot.symptoms_text
      ? formSnapshot.symptoms_text
          .split(/[,;\n]+/) // split by comma, semicolon, or newline
          .map((s) => s.trim())
          .filter(Boolean)
          .map(normalize)
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

    console.log("🧠 Final mappedFeatures:", mappedFeatures);

    // --- Call Flask model prediction API ---
    const result = await predictDisease(mappedFeatures);
    console.log("✅ Flask Response:", result);

    // --- Get advice based on the predicted disease ---
    const predicted = result.prediction || "Unknown";
    const advice = diseaseAdvice[predicted] || {
      short: "No specific guidance available.",
      avoid: [],
      do: ["Follow up with a medical professional if worried."],
      urgent: false,
      notes: "",
    };

    // --- Save everything to MongoDB ---
    const historyEntry = await History.create({
      userId,
      form: formSnapshot,
      features: mappedFeatures,
      prediction: predicted,
      confidence: result.confidence ?? 0,
      explanation: result.explanation ?? null,
      advice, // ✅ NEW field
    });

    // --- Return prediction + advice to frontend ---
    res.json({ ...result, historyId: historyEntry._id, advice });
  } catch (err) {
    console.error("❌ Prediction Error:", err);
    if (err.response) console.error("Flask Error:", err.response.data);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Fetch all past predictions for the logged-in user
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
