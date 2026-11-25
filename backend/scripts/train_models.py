"""Train Crop Recommendation and Fertilizer/Soil Recommendation ML models
from the downloaded Kaggle-origin agricultural CSV datasets.
"""
import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT_DIR = Path(__file__).resolve().parents[2]
DATASETS_DIR = ROOT_DIR / "backend" / "datasets"
MODEL_DIR = ROOT_DIR / "backend" / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def train_crop_model():
    csv_path = DATASETS_DIR / "crop_recommendation.csv"
    df = pd.read_csv(csv_path)
    features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    X = df[features]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    acc = float(accuracy_score(y_test, clf.predict(X_test)))

    out_path = MODEL_DIR / "crop_recommender.joblib"
    joblib.dump({"model": clf, "features": features, "classes": list(clf.classes_)}, out_path)
    print(f"Trained crop_recommender.joblib | rows={len(df)} | classes={len(clf.classes_)} | test_acc={acc:.4f}")
    return {
        "name": "Crop Recommendation (RandomForest)",
        "dataset": "crop_recommendation.csv",
        "samples": int(len(df)),
        "classes": int(len(clf.classes_)),
        "test_accuracy": round(acc, 4),
    }


def train_fertilizer_model():
    csv_path = DATASETS_DIR / "fertilizer_prediction.csv"
    df = pd.read_csv(csv_path)
    # Normalize known column-name whitespace/typos in Kaggle Fertilizer dataset
    df.columns = [c.strip() for c in df.columns]
    rename_map = {
        "Temparature": "Temperature",
        "Phosphorous": "Phosphorus",
    }
    df = df.rename(columns=rename_map)

    num_features = ["Temperature", "Humidity", "Moisture", "Nitrogen", "Potassium", "Phosphorus"]
    cat_features = ["Soil Type", "Crop Type"]
    all_features = num_features + cat_features

    X = df[all_features]
    y = df["Fertilizer Name"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_features),
            ("num", "passthrough", num_features),
        ]
    )
    pipe = Pipeline(
        steps=[
            ("prep", preprocessor),
            ("clf", RandomForestClassifier(n_estimators=150, random_state=42)),
        ]
    )
    pipe.fit(X_train, y_train)
    acc = float(accuracy_score(y_test, pipe.predict(X_test)))

    out_path = MODEL_DIR / "fertilizer_recommender.joblib"
    joblib.dump(
        {
            "model": pipe,
            "features": all_features,
            "soil_types": sorted(df["Soil Type"].unique().tolist()),
            "crop_types": sorted(df["Crop Type"].unique().tolist()),
            "classes": sorted(y.unique().tolist()),
        },
        out_path,
    )
    print(f"Trained fertilizer_recommender.joblib | rows={len(df)} | classes={y.nunique()} | test_acc={acc:.4f}")
    return {
        "name": "Soil & Fertilizer Recommendation (RandomForest)",
        "dataset": "fertilizer_prediction.csv",
        "samples": int(len(df)),
        "classes": int(y.nunique()),
        "test_accuracy": round(acc, 4),
    }


if __name__ == "__main__":
    crop_metrics = train_crop_model()
    fert_metrics = train_fertilizer_model()
    metrics = {
        "models": [
            crop_metrics,
            fert_metrics,
            {
                "name": "Plant Disease Detection (MobileNetV2 PlantVillage)",
                "dataset": "PlantVillage (pretrained HuggingFace)",
                "samples": 54305,
                "classes": 38,
                "test_accuracy": None,
            },
        ]
    }
    with open(MODEL_DIR / "training_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print("Saved training_metrics.json")
