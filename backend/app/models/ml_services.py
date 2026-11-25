import json
import logging
from pathlib import Path
from typing import Any, Dict, List

import cv2
import joblib
import numpy as np
import pandas as pd

from backend.app.config import DATASETS_DIR, MODEL_DIR
from backend.app.llm import GeminiChatWrapper, generate_text, get_llm

logger = logging.getLogger(__name__)

_crop_bundle = None
_fert_bundle = None
_npk_ref_df = None

# Curated Indian ICAR / state-certified seed variety guidance
SEED_CATALOG: Dict[str, List[Dict[str, str]]] = {
    "rice": [
        {"variety": "Uma (MO 16)", "season": "Kharif / Rabi", "water": "High", "duration": "115-120 days", "notes": "Popular high-yielding red rice in Kerala, tolerant to BPH."},
        {"variety": "Pusa Basmati 1121", "season": "Kharif", "water": "Medium-High", "duration": "135-140 days", "notes": "Long-grain aromatic variety suited for Indo-Gangetic plains."},
        {"variety": "Sahbhagi Dhan", "season": "Kharif", "water": "Low-Medium", "duration": "105 days", "notes": "Drought-tolerant upland/rainfed paddy variety."},
    ],
    "maize": [
        {"variety": "DHM 117", "season": "Kharif / Rabi", "water": "Medium", "duration": "100-105 days", "notes": "High-yielding single-cross hybrid resistant to leaf blight."},
        {"variety": "HQPM-1", "season": "Kharif / Rabi", "water": "Medium", "duration": "105 days", "notes": "Quality Protein Maize hybrid suitable across Indian states."},
    ],
    "chickpea": [
        {"variety": "JG 11", "season": "Rabi", "water": "Low", "duration": "95-100 days", "notes": "Wilt-resistant desi chickpea ideal for rainfed central/south India."},
        {"variety": "Pusa 372", "season": "Rabi", "water": "Low", "duration": "130 days", "notes": "Good tolerance for late sowing and dryland conditions."},
    ],
    "cotton": [
        {"variety": "Suraj (ICAR)", "season": "Kharif", "water": "Medium", "duration": "155-165 days", "notes": "Compact long-staple non-Bt variety suitable for high-density planting."},
        {"variety": "MCU 5", "season": "Kharif", "water": "Medium", "duration": "160 days", "notes": "Extra-long staple cotton suited for southern India."},
    ],
    "coconut": [
        {"variety": "West Coast Tall (WCT)", "season": "Perennial", "water": "Medium", "duration": "Perennial (6-7 yrs bearing)", "notes": "Hardy coastal variety tolerant to drought and wind."},
        {"variety": "Chandra Sankara (COD x WCT)", "season": "Perennial", "water": "Medium-High", "duration": "Perennial (4-5 yrs bearing)", "notes": "High-yielding hybrid developed by ICAR-CPCRI Kasaragod."},
    ],
    "banana": [
        {"variety": "Nendran", "season": "Year-round", "water": "High", "duration": "10-11 months", "notes": "Premier Kerala variety suited for humid tropical soils."},
        {"variety": "Grand Naine (G9)", "season": "Year-round", "water": "High", "duration": "11-12 months", "notes": "High-yielding tissue-culture Cavendish variety."},
    ],
    "mungbean": [
        {"variety": "Pusa Vishal", "season": "Zaid / Kharif", "water": "Low", "duration": "60-65 days", "notes": "Short-duration summer/zaid green gram resistant to MYMV."},
    ],
    "blackgram": [
        {"variety": "PU 31", "season": "Kharif / Zaid", "water": "Low-Medium", "duration": "70-75 days", "notes": "Yellow mosaic virus resistant urad variety."},
    ],
    "pigeonpeas": [
        {"variety": "ICPL 87119 (Asha)", "season": "Kharif", "water": "Low-Medium", "duration": "160-170 days", "notes": "Wilt and sterility mosaic resistant red gram."},
    ],
    "coffee": [
        {"variety": "Chandragiri (Arabica)", "season": "Perennial", "water": "Medium", "duration": "Perennial", "notes": "Leaf-rust tolerant variety suited for Wayanad/Western Ghats."},
    ],
}


def _get_crop_bundle():
    global _crop_bundle
    if _crop_bundle is None:
        path = MODEL_DIR / "crop_recommender.joblib"
        if path.exists():
            _crop_bundle = joblib.load(path)
    return _crop_bundle


def _get_fert_bundle():
    global _fert_bundle
    if _fert_bundle is None:
        path = MODEL_DIR / "fertilizer_recommender.joblib"
        if path.exists():
            _fert_bundle = joblib.load(path)
    return _fert_bundle


def _get_npk_ref():
    global _npk_ref_df
    if _npk_ref_df is None:
        path = DATASETS_DIR / "crop_npk_reference.csv"
        if path.exists():
            _npk_ref_df = pd.read_csv(path)
    return _npk_ref_df


def recommend_crops(
    n: float,
    p: float,
    k: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
    language: str = "Hindi",
) -> Dict[str, Any]:
    bundle = _get_crop_bundle()
    if bundle is None:
        raise FileNotFoundError("crop_recommender.joblib not found. Run backend/scripts/train_models.py.")

    model = bundle["model"]
    features = bundle["features"]
    X = pd.DataFrame(
        [[n, p, k, temperature, humidity, ph, rainfall]],
        columns=features,
    )
    probs = model.predict_proba(X)[0]
    classes = model.classes_
    ranked = sorted(
        [{"crop": str(c), "confidence": round(float(prob) * 100, 2)} for c, prob in zip(classes, probs)],
        key=lambda x: x["confidence"],
        reverse=True,
    )
    top_3 = ranked[:3]
    best_crop = top_3[0]["crop"]
    seeds = SEED_CATALOG.get(best_crop.lower(), [
        {
            "variety": f"Certified {best_crop.title()} Local / ICAR Variety",
            "season": "Seasonal",
            "water": "Medium",
            "duration": "Varies by region",
            "notes": "Consult local Krishi Vigyan Kendra (KVK) for state-notified certified seed.",
        }
    ])

    ai_guidance = generate_text(
        f"Soil NPK=({n},{p},{k}), pH={ph}, Temp={temperature}C, Humidity={humidity}%, Rainfall={rainfall}mm. "
        f"The ML model recommended {best_crop} (alternatives: {', '.join(x['crop'] for x in top_3[1:])}). "
        f"Provide 4 concise, practical steps in {language} for sowing preparation and soil care."
    )

    return {
        "recommended_crop": best_crop,
        "top_recommendations": top_3,
        "recommended_seeds": seeds,
        "ai_guidance": ai_guidance,
        "model_info": "RandomForestClassifier trained on 2,200-sample Crop Recommendation dataset",
    }


def analyze_soil_and_fertilizer(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    ph: float,
    moisture: float,
    temperature: float,
    humidity: float,
    soil_type: str,
    crop_type: str,
    language: str = "Hindi",
) -> Dict[str, Any]:
    bundle = _get_fert_bundle()
    predicted_fertilizer = "Balanced NPK / Organic Compost"
    top_fertilizers = []

    if bundle is not None:
        model = bundle["model"]
        X = pd.DataFrame(
            [
                {
                    "Temperature": temperature,
                    "Humidity": humidity,
                    "Moisture": moisture,
                    "Nitrogen": nitrogen,
                    "Potassium": potassium,
                    "Phosphorus": phosphorus,
                    "Soil Type": soil_type,
                    "Crop Type": crop_type,
                }
            ]
        )
        probs = model.predict_proba(X)[0]
        classes = model.classes_
        top_fertilizers = sorted(
            [{"fertilizer": str(c), "confidence": round(float(pr) * 100, 1)} for c, pr in zip(classes, probs)],
            key=lambda x: x["confidence"],
            reverse=True,
        )[:3]
        predicted_fertilizer = top_fertilizers[0]["fertilizer"]

    # Compare against ideal NPK reference when available
    ref_df = _get_npk_ref()
    target_npk = {"N": 60, "P": 40, "K": 40, "pH": 6.5}
    if ref_df is not None:
        match = ref_df[ref_df["Crop"].str.lower() == crop_type.lower()]
        if not match.empty:
            row = match.iloc[0]
            target_npk = {
                "N": float(row["N"]),
                "P": float(row["P"]),
                "K": float(row["K"]),
                "pH": float(row["pH"]),
            }

    deficiencies = []
    if nitrogen < target_npk["N"] * 0.75:
        deficiencies.append(f"Low Nitrogen ({nitrogen} vs ideal ~{target_npk['N']}): Apply vermicompost, green manure, or split Urea.")
    if phosphorus < target_npk["P"] * 0.75:
        deficiencies.append(f"Low Phosphorus ({phosphorus} vs ideal ~{target_npk['P']}): Apply bone meal, rock phosphate, or DAP during basal dose.")
    if potassium < target_npk["K"] * 0.75:
        deficiencies.append(f"Low Potassium ({potassium} vs ideal ~{target_npk['K']}): Apply wood ash, banana stem compost, or MOP.")

    if ph < 5.5:
        ph_status = "Acidic Soil (pH < 5.5) — Apply agricultural lime/dolomite before sowing."
    elif ph > 7.8:
        ph_status = "Alkaline Soil (pH > 7.8) — Apply gypsum and organic compost to buffer pH."
    else:
        ph_status = "Optimal pH Range (5.5 - 7.8) for nutrient uptake."

    if not deficiencies:
        deficiencies.append("NPK levels are well-balanced for the selected crop; maintain with organic compost.")

    ai_summary = generate_text(
        f"Soil test for {crop_type} in {soil_type} soil: N={nitrogen}, P={phosphorus}, K={potassium}, "
        f"pH={ph}, Moisture={moisture}%. ML fertilizer suggestion: {predicted_fertilizer}. "
        f"Give clear, farmer-friendly recommendations in {language} including organic alternatives and dosage precautions."
    )

    return {
        "recommended_fertilizer": predicted_fertilizer,
        "top_fertilizers": top_fertilizers,
        "ph_status": ph_status,
        "deficiencies": deficiencies,
        "target_npk": target_npk,
        "ai_guidance": ai_summary,
    }


def recommend_seeds(
    crop: str,
    soil_type: str,
    season: str,
    water_availability: str,
    state: str,
    language: str = "Hindi",
) -> Dict[str, Any]:
    key = crop.strip().lower()
    varieties = SEED_CATALOG.get(key, [])
    ai_advice = generate_text(
        f"Recommend best certified Indian seed varieties for crop='{crop}', soil='{soil_type}', "
        f"season='{season}', water='{water_availability}', state='{state}'. "
        f"Include seed rate per acre, seed treatment (e.g., Trichoderma/Rhizobium), and spacing in {language}."
    )
    return {
        "crop": crop,
        "catalog_varieties": varieties,
        "ai_advice": ai_advice,
    }


def analyze_image_with_ai(
    image_bytes: bytes,
    mime_type: str,
    mode: str,
    language: str = "Hindi",
    quality_info: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Analyze pest or soil image using Gemini Vision + OpenCV visual metrics."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mean_bgr = img.mean(axis=(0, 1))
    mean_hsv = hsv.mean(axis=(0, 1))

    visual_stats = {
        "dominant_rgb": [int(mean_bgr[2]), int(mean_bgr[1]), int(mean_bgr[0])],
        "saturation": round(float(mean_hsv[1]), 1),
        "brightness": round(float(mean_hsv[2]), 1),
    }

    if mode == "pest":
        prompt = (
            f"You are an Indian agricultural entomologist. Inspect this crop/insect photo and respond in {language}. "
            "1) Identify possible pest or insect damage visible (use cautious language like 'appears consistent with' rather than absolute certainty). "
            "2) Explain crop damage symptoms to check on the field. "
            "3) Recommend eco-friendly/organic control (neem oil, pheromone traps, biocontrol) first, plus safe chemical precautions if severe. "
            "4) Advise consulting local Krishi Vigyan Kendra (KVK) / Krishi Bhavan for confirmation."
        )
        disclaimer = (
            "AI visual inspection is advisory only and not a definitive laboratory diagnosis. "
            "Confirm with your local Krishi Vigyan Kendra (KVK) or agricultural officer before applying chemical pesticides."
        )
    else:
        prompt = (
            f"You are an Indian soil scientist. Inspect this soil photo visually and respond in {language}. "
            "1) Describe visible texture, moisture appearance, and organic matter color clues (note clearly that lab NPK/pH testing is needed for exact values). "
            "2) Suggest suitable crops and organic soil improvement steps (mulching, compost, green manure). "
            "3) Recommend Soil Health Card laboratory testing."
        )
        disclaimer = (
            "Visual soil exploration provides preliminary texture/moisture observations only. "
            "Use an accredited Soil Health Card lab test for exact pH and NPK measurements."
        )

    llm = get_llm()
    ai_analysis = None
    if isinstance(llm, GeminiChatWrapper):
        try:
            ai_analysis = llm.analyze_image(image_bytes, mime_type, prompt)
        except Exception as e:
            logger.error("Gemini Vision error: %s", e)

    if not ai_analysis:
        if mode == "soil":
            hue, sat, val = mean_hsv
            color_hint = (
                "Dark humus-rich appearance (likely higher organic matter)"
                if val < 95
                else ("Reddish/lateritic tone (check pH & phosphorus)" if mean_bgr[2] > mean_bgr[0] + 20 else "Light sandy/silty appearance (add organic compost)")
            )
            ai_analysis = f"Visual Soil Check: {color_hint}. Please run a Soil Health Card lab test for exact NPK and pH values."
        else:
            ai_analysis = (
                "Vision model is unavailable right now. Please inspect leaf undersides for aphids/whiteflies/caterpillars, "
                "use yellow sticky traps, and consult your nearest Krishi Bhavan."
            )

    return {
        "mode": mode,
        "analysis": ai_analysis,
        "visual_stats": visual_stats,
        "quality": quality_info or {},
        "disclaimer": disclaimer,
    }


def get_training_metrics() -> Dict[str, Any]:
    path = MODEL_DIR / "training_metrics.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"models": []}
