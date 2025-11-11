#ml/app.py
from flask import Flask, request, jsonify
import joblib, pandas as pd, numpy as np
from explainability import local_explain
from flask_cors import CORS
MODEL_PATH = "model.pkl"
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
    return jsonify({
        "numeric": SCHEMA["numeric"],
        "categorical": SCHEMA["categorical"],
        "symptoms": SCHEMA["symptoms"],
        "target": SCHEMA["target"],
        "feature_order": FEATURE_ORDER
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        payload = request.get_json(force=True)
        feat = payload.get("features", {})
        x = {c: 0 for c in FEATURE_ORDER}
        for k, v in feat.items():
            if k in x:
                x[k] = v
        X = pd.DataFrame([x])[FEATURE_ORDER]
        pred = PIPELINE.predict(X)[0]
        proba = PIPELINE.predict_proba(X)[0]
        conf = float(np.max(proba))
        try:
            expl = local_explain(x, top_k=6)
        except Exception:
            expl = {"method": "none", "top_contributors": []}
        return jsonify({
            "prediction": pred,
            "confidence": conf,
            "explanation": expl
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
