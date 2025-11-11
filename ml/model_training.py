
import os, json, joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

from preprocessing import load_dataset, get_feature_schema, build_preprocessor, TARGET_COL

DATA_PATH = os.path.join("dataset", "realistic_symptom_disease_dataset.csv")
MODEL_PATH = "model.pkl"
REPORT_PATH = "training_report.json"

def train():
    df = load_dataset(DATA_PATH)
    schema = get_feature_schema(df)

    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    preprocessor = build_preprocessor(schema)

    clf = RandomForestClassifier(
        n_estimators=600, max_depth=18, min_samples_split=2, min_samples_leaf=1,
        class_weight="balanced", random_state=42, n_jobs=-1
    )

    pipe = Pipeline([("prep", preprocessor), ("clf", clf)])
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    joblib.dump({"pipeline": pipe, "schema": schema}, MODEL_PATH)

    with open(REPORT_PATH, "w", encoding="utf-8") as fp:
        json.dump({"accuracy": acc, "precision_weighted": prec, "recall_weighted": rec, "f1_weighted": f1, "classification_report": report}, fp, indent=2)

    print(f"Saved model to {MODEL_PATH}")
    print(f"Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")

if __name__ == "__main__":
    train()
