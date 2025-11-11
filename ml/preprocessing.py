
import pandas as pd
from typing import Dict, List
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

TARGET_COL = "Disease"
NUMERIC_COLS = ["Age"]
CATEGORICAL_COLS = ["Sex", "SmokingHistory", "DietType", "ExerciseFrequency"]

def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    return df

def get_feature_schema(df: pd.DataFrame) -> Dict[str, List[str]]:
    all_cols = set(df.columns)
    reserved = set([TARGET_COL] + NUMERIC_COLS + CATEGORICAL_COLS)
    symptoms = [c for c in df.columns if c not in reserved]
    return {"numeric": NUMERIC_COLS, "categorical": CATEGORICAL_COLS, "symptoms": symptoms, "target": TARGET_COL}

def build_preprocessor(schema: Dict[str, List[str]]) -> ColumnTransformer:
    numeric = schema["numeric"]
    categorical = schema["categorical"]
    transformers = []
    if len(numeric) > 0:
        transformers.append(("num", StandardScaler(), numeric))
    if len(categorical) > 0:
        transformers.append(("cat", OneHotEncoder(handle_unknown="ignore"), categorical))
    preprocessor = ColumnTransformer(transformers=transformers, remainder="passthrough", verbose_feature_names_out=True)
    return preprocessor
