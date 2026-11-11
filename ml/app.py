# ml/app.py
import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from explainability import local_explain

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

app = Flask(__name__)
CORS(app)

bundle = joblib.load(MODEL_PATH)
PIPELINE = bundle["pipeline"]
SCHEMA = bundle["schema"]
FEATURE_ORDER = SCHEMA["numeric"] + SCHEMA["categorical"] + SCHEMA["symptoms"]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": True, "features": FEATURE_ORDER})


@app.route("/schema", methods=["GET"])
def schema():
    prep = PIPELINE.named_steps["prep"]
    categories = {}
    try:
        enc = prep.named_transformers_["cat"]
        categories = {col: [str(v) for v in cats] for col, cats in zip(SCHEMA["categorical"], enc.categories_)}
    except Exception:
        pass
    return jsonify({
        "numeric": SCHEMA["numeric"],
        "categorical": SCHEMA["categorical"],
        "categories": categories,
        "symptoms": SCHEMA["symptoms"],
        "target": SCHEMA["target"],
        "classes": [str(c) for c in PIPELINE.classes_],
        "feature_order": FEATURE_ORDER,
    })


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("features"), dict):
        return jsonify({"error": "Request body must be JSON: {\"features\": {...}}"}), 400

    feat = payload["features"]
    x = {c: 0 for c in FEATURE_ORDER}
    for k, v in feat.items():
        if k in x:
            x[k] = v

    for col in SCHEMA["numeric"]:
        try:
            x[col] = float(x[col])
        except (TypeError, ValueError):
            return jsonify({"error": f"'{col}' must be a number"}), 400

    try:
        X = pd.DataFrame([x])[FEATURE_ORDER]
        proba = PIPELINE.predict_proba(X)[0]
        idx = int(np.argmax(proba))
        pred = str(PIPELINE.classes_[idx])
        conf = float(proba[idx])
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    try:
        expl = local_explain(x, top_k=6, pipe=PIPELINE, schema=SCHEMA)
    except Exception:
        expl = {"method": "none", "top_contributors": []}

    return jsonify({"prediction": pred, "confidence": conf, "explanation": expl})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
