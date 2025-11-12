// backend/controllers/predictionController.js
import History from "../models/History.js";
import { predictDisease } from "../utils/mlService.js";

export const predict = async (req, res) => {
  try {
    const { features } = req.body; // raw frontend form data
    const userId = req.userId || null;

    // --- Human-readable snapshot (stores exactly what user entered) ---
    const formSnapshot = {
      age: Number(features.age) || null,
      sex: features.sex || "",
      diet_type: features.diet_type || "",
      smoking_history: features.smoking_history || "",
      physical_activity: features.physical_activity || "",
      symptoms_text: (features.symptoms || "").trim(), // exact user input
    };

    // --- ML-ready features mapping (used for model prediction) ---
    const mappedFeatures = {
      Age: formSnapshot.age,
      Sex: formSnapshot.sex,
      SmokingHistory: formSnapshot.smoking_history,
      DietType: formSnapshot.diet_type,
      ExerciseFrequency: formSnapshot.physical_activity,
    };

    // --- Normalize and convert symptoms for model input ---
    const normalize = (text) => text.replace(/[\s_]+/g, "").toLowerCase();
    const symptomList = formSnapshot.symptoms_text
      ? formSnapshot.symptoms_text
          .split(/[,;]+|\n+/) // split by comma, semicolon, or newline
          .map((s) => s.trim())
          .filter(Boolean)
          .map(normalize)
      : [];

    const symptomKeys = [
      "Back Pain","Bleeding Gums","Blurred Vision","Body Ache","Chest Pain",
      "Cold Hands","Cough","Dizziness","Fatigue","Fever","Frequent Urination",
      "Headache","High Fever","Increased Thirst","Irregular Heartbeat","Itching",
      "Joint Pain","Loss of Smell","Nausea","Pale Skin","Rash",
      "Shortness of Breath","Slow Healing","Sore Throat","Sweating","Swelling",
      "Weakness","Weight Loss"
    ];

    symptomKeys.forEach((key) => {
      mappedFeatures[key] = symptomList.includes(normalize(key)) ? 1 : 0;
    });

    console.log("🧠 Final mappedFeatures:", mappedFeatures);

    // --- Send to ML model (Flask API) ---
    const result = await predictDisease(mappedFeatures);
    console.log("✅ Flask Response:", result);

    // --- Save everything into MongoDB (readable + ML input) ---
    const historyEntry = await History.create({
      userId,
      form: formSnapshot, // <-- stores age, sex, diet, etc., + symptoms_text
      features: mappedFeatures, // <-- one-hot encoded ML features
      prediction: result.prediction,
      confidence: result.confidence,
      explanation: result.explanation || null,
    });

    res.json({ ...result, historyId: historyEntry._id });
  } catch (err) {
    console.error("❌ Prediction Error:", err.message);
    if (err.response) console.error("Flask Error:", err.response.data);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Fetch history for logged-in user
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
