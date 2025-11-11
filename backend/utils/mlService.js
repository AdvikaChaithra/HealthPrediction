//backend/utils/mlService.js
import axios from "axios";

const FLASK_API = process.env.ML_API_URL || "http://127.0.0.1:5000";

export const getSchema = async () => {
  const res = await axios.get(`${FLASK_API}/schema`);
  return res.data;
};

export const predictDisease = async (features) => {
  console.log("➡️ Sending to Flask:", features);
  console.log("📡 Flask URL:", `${FLASK_API}/predict`);

  try {
    const res = await axios.post(`${FLASK_API}/predict`, { features });
    console.log("✅ Flask Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Flask request failed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error Message:", err.message);
    }
    throw err;
  }
};
