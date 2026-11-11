import os, json, joblib
import numpy as np
import pandas as pd

MODEL_PATH = "model.pkl"
GLOBAL_PATH = "global_explain.json"

# Cache the loaded model and SHAP explainer so they are built once per process,
# not on every prediction request.
_BUNDLE = None
_EXPLAINER = None


def _load_bundle():
    global _BUNDLE
    if _BUNDLE is None:
        _BUNDLE = joblib.load(MODEL_PATH)
    return _BUNDLE


def _get_explainer(pipe):
    global _EXPLAINER
    if _EXPLAINER is None:
        import shap
        _EXPLAINER = shap.TreeExplainer(pipe.named_steps["clf"])
    return _EXPLAINER


def _get_feature_names(pipeline, X: pd.DataFrame):
    prep = pipeline.named_steps["prep"]
    try:
        return list(prep.get_feature_names_out())
    except Exception:
        return list(X.columns)


def _clean_name(name) -> str:
    """'remainder__Fever' -> 'Fever', 'cat__Sex_Male' -> 'Sex_Male'."""
    return str(name).split("__", 1)[-1]


def _to_dense(X):
    return X.toarray() if hasattr(X, "toarray") else np.asarray(X)


def global_explain(save_path: str = GLOBAL_PATH, top_k: int = 20):
    bundle = _load_bundle()
    pipe = bundle["pipeline"]

    data_path = os.path.join("dataset", "realistic_symptom_disease_dataset.csv")
    df = pd.read_csv(data_path)
    df.columns = [c.strip() for c in df.columns]
    X = df.drop(columns=["Disease"])
    # Use the already-fitted preprocessor (do NOT refit it).
    X_trans = _to_dense(pipe.named_steps["prep"].transform(X))
    feature_names = _get_feature_names(pipe, X)

    try:
        import shap
        explainer = _get_explainer(pipe)
        bg = shap.sample(X_trans, 200, random_state=42)
        vals = np.asarray(explainer(bg).values)
        # Multiclass -> (samples, features, classes); average over samples and classes.
        axes = (0, 2) if vals.ndim == 3 else (0,)
        importance = np.abs(vals).mean(axis=axes)
        method = "shap"
    except Exception:
        importance = pipe.named_steps["clf"].feature_importances_
        method = "feature_importances"

    order = np.argsort(importance)[::-1][:top_k]
    explanation = {
        "method": method,
        "top_features": [{"feature": _clean_name(feature_names[i]), "importance": float(importance[i])} for i in order],
    }

    with open(save_path, "w", encoding="utf-8") as fp:
        json.dump(explanation, fp, indent=2)
    print(f"Global explanation saved to {save_path}")


def local_explain(sample: dict, top_k: int = 6, pipe=None, schema=None) -> dict:
    """Explain a single prediction for the class the model predicted."""
    if pipe is None or schema is None:
        bundle = _load_bundle()
        pipe = pipe or bundle["pipeline"]
        schema = schema or bundle["schema"]

    feat_order = schema["numeric"] + schema["categorical"] + schema["symptoms"]
    x = {c: 0 for c in feat_order}
    for k, v in sample.items():
        if k in x:
            x[k] = v
    X_df = pd.DataFrame([x])[feat_order]

    prep = pipe.named_steps["prep"]
    clf = pipe.named_steps["clf"]
    feat_names = prep.get_feature_names_out()

    try:
        X_trans = _to_dense(prep.transform(X_df))
        vals = np.asarray(_get_explainer(pipe)(X_trans).values)
        if vals.ndim == 3:
            # (1, features, classes): take the column of the predicted class.
            class_idx = int(np.argmax(clf.predict_proba(X_trans)[0]))
            row = vals[0, :, class_idx]
        else:
            row = vals[0]
        order = np.argsort(np.abs(row))[::-1][:top_k]
        return {
            "method": "shap",
            "top_contributors": [
                {"feature": _clean_name(feat_names[i]), "contribution": float(row[i])} for i in order
            ],
        }
    except Exception:
        importances = clf.feature_importances_
        top = np.argsort(importances)[::-1][:top_k]
        return {
            "method": "feature_importances_fallback",
            "top_contributors": [
                {"feature": _clean_name(feat_names[i]), "contribution": float(importances[i])} for i in top
            ],
        }


if __name__ == "__main__":
    global_explain()
