
import os, json, joblib, numpy as np, pandas as pd

MODEL_PATH = "model.pkl"
GLOBAL_PATH = "global_explain.json"

def _get_feature_names(pipeline, X: pd.DataFrame):
    prep = pipeline.named_steps["prep"]
    try:
        names = prep.get_feature_names_out()
        return list(names)
    except Exception:
        return list(X.columns)

def global_explain(save_path: str = GLOBAL_PATH, top_k: int = 20):
    bundle = joblib.load(MODEL_PATH)
    pipe = bundle["pipeline"]

    data_path = os.path.join("dataset", "realistic_symptom_disease_dataset.csv")
    df = pd.read_csv(data_path)
    X = df.drop(columns=["Disease"])
    X_trans = pipe.named_steps["prep"].fit_transform(X)
    feature_names = _get_feature_names(pipe, X)

    explanation = {}
    try:
        import shap
        explainer = shap.TreeExplainer(pipe.named_steps["clf"])
        bg = shap.sample(X_trans, 200, random_state=42)
        shap_vals = explainer(bg)
        vals = np.abs(shap_vals.values).mean(axis=(0,1))
        order = np.argsort(vals)[::-1][:top_k]
        explanation = {"method": "shap", "top_features": [{"feature": feature_names[i], "importance": float(vals[i])} for i in order]}
    except Exception:
        importances = pipe.named_steps["clf"].feature_importances_
        order = np.argsort(importances)[::-1][:top_k]
        explanation = {"method": "feature_importances", "top_features": [{"feature": feature_names[i], "importance": float(importances[i])} for i in order]}

    with open(save_path, "w", encoding="utf-8") as fp:
        json.dump(explanation, fp, indent=2)
    print(f"Global explanation saved to {save_path}")

def local_explain(sample: dict, top_k: int = 6) -> dict:
    bundle = joblib.load(MODEL_PATH)
    pipe = bundle["pipeline"]
    schema = bundle["schema"]

    feat_order = schema["numeric"] + schema["categorical"] + schema["symptoms"]
    x = {c: 0 for c in feat_order}
    for k, v in sample.items():
        if k in x:
            x[k] = v
    X_df = pd.DataFrame([x])[feat_order]

    try:
        import shap, numpy as np
        explainer = shap.Explainer(pipe.named_steps["clf"])
        X_trans = pipe.named_steps["prep"].transform(X_df)
        shap_vals = explainer(X_trans)
        vals = np.abs(shap_vals.values).mean(axis=0)
        feat_names = pipe.named_steps["prep"].get_feature_names_out()
        order = np.argsort(vals)[::-1][:top_k]
        return {"method": "shap", "top_contributors": [{"feature": str(feat_names[i]), "contribution": float(vals[i])} for i in order]}
    except Exception:
        import numpy as np
        importances = pipe.named_steps["clf"].feature_importances_
        feat_names = pipe.named_steps["prep"].get_feature_names_out()
        top = np.argsort(importances)[::-1][:top_k]
        return {"method": "feature_importances_fallback", "top_contributors": [{"feature": str(feat_names[i]), "contribution": float(importances[i])} for i in top]}

if __name__ == "__main__":
    global_explain()
