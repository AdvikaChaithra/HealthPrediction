// backend/utils/mlService.js
import axios from "axios";

// Read lazily so the value from .env is always picked up.
const flaskUrl = () => (process.env.ML_API_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");

export const getSchema = async () => {
  const res = await axios.get(`${flaskUrl()}/schema`, { timeout: 10000 });
  return res.data;
};

export const predictDisease = async (features) => {
  try {
    const res = await axios.post(`${flaskUrl()}/predict`, { features }, { timeout: 30000 });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error("❌ ML service request failed:", detail);
    const error = new Error(
      err.response ? `ML service error: ${detail}` : "ML service is unavailable. Is the Flask app running?"
    );
    error.status = 502;
    throw error;
  }
};
