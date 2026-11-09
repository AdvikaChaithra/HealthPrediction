// backend/controllers/predictionController.js
import History from "../models/History.js";
import { predictDisease } from "../utils/mlService.js";
import diseaseAdvice from "../config/diseaseAdvice.js";

// Normalize text for consistent lookups ("Loss_of-smell " -> "loss of smell")
const normalize = (text) =>
  (text || "")
    .toString()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Symptom columns the model was trained on
export const SYMPTOM_KEYS = [
  "Back Pain", "Bleeding Gums", "Blurred Vision", "Body Ache", "Chest Pain",
  "Cold Hands", "Cough", "Dizziness", "Fatigue", "Fever",
  "Frequent Urination", "Headache", "High Fever", "Increased Thirst",
  "Irregular Heartbeat", "Itching", "Joint Pain", "Loss of Smell",
  "Nausea", "Pale Skin", "Rash", "Shortness of Breath", "Slow Healing",
  "Sore Throat", "Sweating", "Swelling", "Weakness", "Weight Loss",
];

// The model only knows these category values. Map form/profile values onto them;
// anything unrecognised would otherwise be silently ignored by the one-hot encoder.
const DIET_MAP = {
  healthy: "Healthy",
  average: "Average",
  unhealthy: "Unhealthy",
  // legacy profile values
  vegetarian: "Healthy",
  vegan: "Healthy",
  pescatarian: "Healthy",
  "non vegetarian": "Average",
  other: "Average",
};

const ACTIVITY_MAP = {
  rarely: "Rarely",
  occasional: "Occasional",
  regular: "Regular",
  // legacy form values
  low: "Rarely",
  moderate: "Occasional",
  high: "Regular",
};

const SMOKING_VALUES = ["Never", "Former", "Current"];
const SEX_VALUES = ["Male", "Female", "Other"];

const FALLBACK_ADVICE = {
  short: "No specific guidance available.",
  avoid: [],
  do: ["Consult a healthcare provider for personalized advice."],
  prevention: [],
  nutrition: { recommended: [], avoid: [] },
  urgent: false,
  notes: "",
};

// Normalized lookup table: "covid 19" -> COVID-19 advice, etc.
const adviceByKey = Object.fromEntries(
  Object.entries(diseaseAdvice).map(([k, v]) => [normalize(k), v])
);

export const predict = async (req, res) => {
  try {
    const features = req.body?.features;
    if (!features || typeof features !== "object") {
      return res.status(400).json({ message: "Request body must include a 'features' object" });
    }

    const age = Number(features.age);
    if (features.age === "" || features.age == null || !Number.isFinite(age) || age < 0 || age > 120) {
      return res.status(400).json({ message: "Please enter a valid age (0-120)" });
    }

    const sex = SEX_VALUES.find((s) => normalize(s) === normalize(features.sex));
    if (!sex) return res.status(400).json({ message: "Sex must be Male, Female, or Other" });

    const smoking = SMOKING_VALUES.find((s) => normalize(s) === normalize(features.smoking_history));
    if (!smoking) return res.status(400).json({ message: "Smoking history must be Never, Former, or Current" });

    const diet = DIET_MAP[normalize(features.diet_type)];
    if (!diet) return res.status(400).json({ message: "Diet type must be Healthy, Average, or Unhealthy" });

    const activity = ACTIVITY_MAP[normalize(features.physical_activity)];
    if (!activity) {
      return res.status(400).json({ message: "Physical activity must be Rarely, Occasional, or Regular" });
    }

    const symptomsText = (features.symptoms || "").toString().trim();
    const symptomList = symptomsText
      .split(/[,;\n]+/)
      .map((s) => normalize(s))
      .filter(Boolean);

    // --- User-friendly snapshot (what the user entered) ---
    const formSnapshot = {
      age,
      sex,
      diet_type: features.diet_type,
      smoking_history: smoking,
      physical_activity: features.physical_activity,
      symptoms_text: symptomsText,
    };

    // --- ML-ready features ---
    const mappedFeatures = {
      Age: age,
      Sex: sex,
      SmokingHistory: smoking,
      DietType: diet,
      ExerciseFrequency: activity,
    };

    const matched = [];
    SYMPTOM_KEYS.forEach((key) => {
      const hit = symptomList.includes(normalize(key));
      mappedFeatures[key] = hit ? 1 : 0;
      if (hit) matched.push(key);
    });

    if (matched.length === 0) {
      return res.status(400).json({
        message: `None of the entered symptoms were recognised. Try for example: ${SYMPTOM_KEYS.slice(0, 6).join(", ")}.`,
      });
    }

    const unrecognized = symptomList.filter(
      (s) => !SYMPTOM_KEYS.some((k) => normalize(k) === s)
    );

    // --- Get prediction from ML model ---
    const result = await predictDisease(mappedFeatures);
    const predicted = String(result.prediction || "Unknown").trim();

    const advice =
      adviceByKey[normalize(predicted)] || diseaseAdvice["default"] || FALLBACK_ADVICE;

    const historyEntry = await History.create({
      userId: req.userId,
      form: formSnapshot,
      features: mappedFeatures,
      prediction: predicted,
      confidence: result.confidence ?? 0,
      explanation: result.explanation ?? null,
      advice,
    });

    res.json({
      prediction: predicted,
      confidence: result.confidence ?? 0,
      explanation: result.explanation ?? null,
      matchedSymptoms: matched,
      unrecognizedSymptoms: unrecognized,
      historyId: historyEntry._id,
      createdAt: historyEntry.createdAt,
      advice,
    });
  } catch (err) {
    console.error("❌ Prediction Error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Prediction failed" });
  }
};

// Fetch the logged-in user's prediction history (newest first)
export const getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ History Fetch Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
