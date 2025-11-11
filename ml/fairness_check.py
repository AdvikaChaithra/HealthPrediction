
import os, joblib, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

DATA_PATH = os.path.join("dataset", "realistic_symptom_disease_dataset.csv")
MODEL_PATH = "model.pkl"
REPORT_CSV = "fairness_report.csv"

def _metrics(y_true, y_pred):
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_weighted": precision_score(y_true, y_pred, average="weighted", zero_division=0),
        "recall_weighted": recall_score(y_true, y_pred, average="weighted", zero_division=0),
        "f1_weighted": f1_score(y_true, y_pred, average="weighted", zero_division=0),
    }

def run_fairness_check():
    bundle = joblib.load(MODEL_PATH)
    pipe = bundle["pipeline"]

    df = pd.read_csv(DATA_PATH)
    X = df.drop(columns=["Disease"])
    y = df["Disease"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    y_pred = pipe.predict(X_test)

    rows = []
    rows.append({"group": "OVERALL", **_metrics(y_test, y_pred)})

    for sex in ["Male", "Female"]:
        mask = X_test["Sex"] == sex
        if mask.sum() > 0:
            yp = pipe.predict(X_test[mask])
            rows.append({"group": f"Sex={sex}", **_metrics(y_test[mask], yp)})

    bins = [0, 30, 45, 60, 200]
    labels = ["<=30", "31-45", "46-60", "60+"]
    age_group = pd.cut(X_test["Age"], bins=bins, labels=labels, right=True, include_lowest=True)
    for ag in age_group.unique():
        mask = age_group == ag
        if mask.sum() > 0:
            yp = pipe.predict(X_test[mask])
            rows.append({"group": f"Age={ag}", **_metrics(y_test[mask], yp)})

    rep = pd.DataFrame(rows)
    rep.to_csv(REPORT_CSV, index=False)
    print(f"Fairness report saved to {REPORT_CSV}")
    return rep

if __name__ == "__main__":
    run_fairness_check()
