from typing import Optional
import httpx
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from backend.app.llm import generate_text

router = APIRouter(prefix="/api", tags=["Weather, Market & Advisories"])

DEMO_MANDI_PRICES = [
    {"state": "Kerala", "mandi": "Thrissur APMC", "crop": "Paddy (Common)", "min_price": 2180, "max_price": 2340, "modal_price": 2260, "unit": "INR/Quintal", "trend": "up"},
    {"state": "Kerala", "mandi": "Kozhikode Market", "crop": "Coconut", "min_price": 2850, "max_price": 3200, "modal_price": 3020, "unit": "INR/Quintal", "trend": "stable"},
    {"state": "Kerala", "mandi": "Idukki Spice Mandi", "crop": "Black Pepper", "min_price": 58000, "max_price": 62500, "modal_price": 60200, "unit": "INR/Quintal", "trend": "up"},
    {"state": "Kerala", "mandi": "Ernakulam Market", "crop": "Banana (Nendran)", "min_price": 3600, "max_price": 4300, "modal_price": 3950, "unit": "INR/Quintal", "trend": "up"},
    {"state": "Maharashtra", "mandi": "Lasalgaon APMC", "crop": "Onion", "min_price": 1750, "max_price": 2400, "modal_price": 2100, "unit": "INR/Quintal", "trend": "down"},
    {"state": "Maharashtra", "mandi": "Nagpur APMC", "crop": "Cotton", "min_price": 6700, "max_price": 7250, "modal_price": 7000, "unit": "INR/Quintal", "trend": "stable"},
    {"state": "Punjab", "mandi": "Khanna Mandi", "crop": "Wheat", "min_price": 2275, "max_price": 2420, "modal_price": 2350, "unit": "INR/Quintal", "trend": "stable"},
    {"state": "Punjab", "mandi": "Ludhiana Mandi", "crop": "Maize", "min_price": 1980, "max_price": 2225, "modal_price": 2110, "unit": "INR/Quintal", "trend": "up"},
    {"state": "Madhya Pradesh", "mandi": "Indore APMC", "crop": "Soybean", "min_price": 4300, "max_price": 4750, "modal_price": 4540, "unit": "INR/Quintal", "trend": "stable"},
    {"state": "Madhya Pradesh", "mandi": "Sehore Mandi", "crop": "Chickpea (Chana)", "min_price": 5300, "max_price": 5750, "modal_price": 5520, "unit": "INR/Quintal", "trend": "up"},
    {"state": "Uttar Pradesh", "mandi": "Agra Mandi", "crop": "Potato", "min_price": 1150, "max_price": 1520, "modal_price": 1340, "unit": "INR/Quintal", "trend": "down"},
    {"state": "Karnataka", "mandi": "Hassan Mandi", "crop": "Coffee (Robusta)", "min_price": 18200, "max_price": 19600, "modal_price": 18900, "unit": "INR/Quintal", "trend": "up"},
]

GOVERNMENT_SCHEMES = [
    {
        "id": "pm-kisan",
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "category": "Income Support",
        "benefit": "Rs. 6,000 per year in 3 equal installments directly to farmer bank accounts.",
        "eligibility": "Landholding farmer families subject to state land records & e-KYC.",
        "documents": ["Aadhaar Card", "Land Ownership (ROR/Khata)", "Bank Passbook", "Mobile Number"],
        "official_url": "https://pmkisan.gov.in/",
    },
    {
        "id": "pmfby",
        "name": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "category": "Crop Insurance",
        "benefit": "Comprehensive yield/calamity crop insurance at subsidized farmer premium (2% Kharif, 1.5% Rabi, 5% commercial/horticultural).",
        "eligibility": "Loanee and non-loanee farmers cultivating notified crops in notified areas.",
        "documents": ["Aadhaar", "Bank Account", "Land Record / Lease Agreement", "Sowing Certificate"],
        "official_url": "https://pmfby.gov.in/",
    },
    {
        "id": "kcc",
        "name": "Kisan Credit Card (KCC)",
        "category": "Credit & Loan",
        "benefit": "Short-term crop & allied credit at subsidized interest (effective 4% p.a. on prompt repayment).",
        "eligibility": "Owner cultivators, tenant farmers, sharecroppers, and SHGs.",
        "documents": ["Aadhaar", "PAN", "Land Record / Cultivation Proof", "Passport Photos"],
        "official_url": "https://www.myscheme.gov.in/schemes/kcc",
    },
    {
        "id": "shc",
        "name": "Soil Health Card (SHC) Scheme",
        "category": "Soil Health",
        "benefit": "Free soil nutrient testing (NPK, pH, EC, micronutrients) and crop-wise fertilizer advice.",
        "eligibility": "All farmers across India via state agriculture labs & Krishi Bhavans.",
        "documents": ["Aadhaar Card", "Land Parcel Details"],
        "official_url": "https://soilhealth.dac.gov.in/",
    },
    {
        "id": "pmksy",
        "name": "PMKSY — Per Drop More Crop (Micro-Irrigation)",
        "category": "Irrigation Subsidy",
        "benefit": "45%-55%+ subsidy on drip and sprinkler irrigation installations.",
        "eligibility": "Farmers with valid land ownership & water source.",
        "documents": ["Aadhaar", "Land Records", "Bank Details", "Quotation from approved vendor"],
        "official_url": "https://pmksy.gov.in/",
    },
    {
        "id": "pkvy",
        "name": "Paramparagat Krishi Vikas Yojana (PKVY)",
        "category": "Organic Farming",
        "benefit": "Cluster-based financial assistance for organic inputs, PGS certification, and marketing.",
        "eligibility": "Farmer clusters (20+ ha) adopting organic farming.",
        "documents": ["Aadhaar", "Cluster Registration", "Land Details"],
        "official_url": "https://pgsindia-ncof.gov.in/",
    },
    {
        "id": "smam",
        "name": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "category": "Farm Equipment",
        "benefit": "40%-50% subsidy on tractors, power tillers, sprayers, harvesters, and custom hiring centers.",
        "eligibility": "Small/marginal farmers, women farmers, SC/ST farmers, and FPOs.",
        "documents": ["Aadhaar", "Bank Passbook", "Land Records", "Caste Certificate (if applicable)"],
        "official_url": "https://agrimachinery.nic.in/",
    },
]

ORGANIC_GUIDES = [
    {
        "title": "Vermicompost Preparation (60-Day Pit Method)",
        "category": "Soil Fertility",
        "steps": [
            "Layer 10 cm dry crop residue at the bottom of a shaded pit or HDPE bed.",
            "Mix cow dung slurry and chopped green biomass (30:70 ratio) and allow 10 days pre-decomposition.",
            "Release Eisenia fetida earthworms (1 kg per sq. meter) and keep 50%-60% moisture.",
            "Harvest dark, crumbly castings after 55-65 days and sieve before field application.",
        ],
    },
    {
        "title": "Neem Oil Bio-Pesticide (3% Emulsion)",
        "category": "Natural Pest Control",
        "steps": [
            "Mix 30 ml cold-pressed neem oil with 5 ml liquid soap/emulsifier in 1 liter warm water.",
            "Dilute with 9 liters clean water (total 10 liters spray solution).",
            "Spray during late afternoon (4 PM - 6 PM) covering leaf undersides for aphids, whiteflies & mites.",
        ],
    },
    {
        "title": "Jeevamrutham Microbial Culture",
        "category": "Bio-Fertilizer",
        "steps": [
            "Mix 10 kg fresh cow dung + 10 L cow urine + 2 kg jaggery + 2 kg pulse flour + handful of undisturbed soil in 200 L water.",
            "Stir clockwise twice daily in shade for 4-6 days.",
            "Apply 200 L per acre along with irrigation water every 15 days.",
        ],
    },
    {
        "title": "Crop Rotation & Trap Cropping",
        "category": "Sustainable Farming",
        "steps": [
            "Rotate cereal crops (rice/wheat/maize) with nitrogen-fixing legumes (moong/urad/chickpea).",
            "Plant marigold borders around tomato/okra to trap fruit borers and reduce root-knot nematodes.",
        ],
    },
]

EQUIPMENT_GUIDES = [
    {
        "name": "Power Tiller / Mini Tractor (12-20 HP)",
        "best_for": "Small & medium holdings (1-5 acres), paddy puddling, inter-cultivation.",
        "maintenance": "Check engine oil every 50 hours, clean air filter weekly in dusty fields, grease rotary blades after wet puddling.",
        "subsidy_note": "Eligible for 40%-50% subsidy under SMAM portal.",
    },
    {
        "name": "Battery / Solar Knapsack Sprayer (16 L)",
        "best_for": "Uniform foliar spraying of neem oil, micronutrients, and bio-pesticides.",
        "maintenance": "Flush tank with clean water after every spray, clean brass nozzle tip, avoid full battery discharge.",
        "subsidy_note": "Low-cost mechanization support via state Krishi Bhavans.",
    },
    {
        "name": "Drip & Micro-Sprinkler Kit",
        "best_for": "Horticulture, banana, coconut, vegetables, and water-scarce regions.",
        "maintenance": "Flush sand/screen filters weekly and run mild acid/vinegar flush quarterly to prevent emitter clogging.",
        "subsidy_note": "45%-55% subsidy under PMKSY Per Drop More Crop.",
    },
    {
        "name": "Portable Soil pH & Moisture Meter",
        "best_for": "Quick field checks before irrigation or lime/gypsum scheduling.",
        "maintenance": "Wipe metal probes dry after each reading and never store inserted in wet soil.",
        "subsidy_note": "Pair with official Soil Health Card testing every 2 years.",
    },
]


class IrrigationPlanRequest(BaseModel):
    crop: str
    growth_stage: str = "Vegetative"
    soil_type: str = "Loamy"
    area_acres: float = Field(1.0, gt=0)
    temperature_c: float = 30.0
    rain_expected_mm: float = 0.0
    language: str = "Hindi"


class InsuranceHelpRequest(BaseModel):
    crop: str
    damage_cause: str
    damage_date: str
    language: str = "Hindi"


@router.get("/weather")
async def get_weather(location: str = Query("Thrissur", min_length=2)):
    """Fetch real live weather from Open-Meteo API + farming alerts."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            geo = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": location, "count": 1, "language": "en", "format": "json"},
            )
            geo_data = geo.json()
            results = geo_data.get("results") or []
            if not results:
                return {"error": f"Location '{location}' not found.", "is_live": False}

            place = results[0]
            lat, lon = place["latitude"], place["longitude"]
            resolved_name = f"{place.get('name')}, {place.get('admin1', '')} ({place.get('country', '')})".strip(", ")

            fc = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
                    "timezone": "auto",
                    "forecast_days": 5,
                },
            )
            fc_data = fc.json()

        current = fc_data.get("current", {})
        daily = fc_data.get("daily", {})

        temp = current.get("temperature_2m", 0)
        humidity = current.get("relative_humidity_2m", 0)
        precip = current.get("precipitation", 0)
        wind = current.get("wind_speed_10m", 0)

        alerts = []
        if precip > 10 or (daily.get("precipitation_sum") and daily["precipitation_sum"][0] > 20):
            alerts.append("Heavy rain alert: Avoid foliar spraying today and ensure field drainage channels are clear.")
        if temp >= 36:
            alerts.append("Heat stress alert: Irrigate early morning/evening and apply crop residue mulch.")
        if humidity >= 82:
            alerts.append("High humidity (>82%): Monitor crops for fungal blight, mildew, and blast.")
        if wind >= 25:
            alerts.append("Strong wind alert: Postpone pesticide/nutrient spraying to avoid drift.")
        if not alerts:
            alerts.append("Favorable weather window for routine field work, weeding, and scheduled irrigation.")

        forecast = []
        dates = daily.get("time", [])
        for i, d in enumerate(dates):
            forecast.append(
                {
                    "date": d,
                    "temp_max": daily["temperature_2m_max"][i],
                    "temp_min": daily["temperature_2m_min"][i],
                    "rain_mm": daily["precipitation_sum"][i],
                    "rain_prob": daily["precipitation_probability_max"][i],
                }
            )

        return {
            "is_live": True,
            "source": "Open-Meteo Live Weather API",
            "location": resolved_name,
            "current": {
                "temperature_c": temp,
                "humidity": humidity,
                "precipitation_mm": precip,
                "wind_kmh": wind,
            },
            "forecast": forecast,
            "farming_alerts": alerts,
        }
    except Exception as e:
        return {
            "is_live": False,
            "error": f"Could not fetch live weather ({str(e)}). Check internet connection.",
        }


@router.post("/irrigation/plan")
def plan_irrigation(payload: IrrigationPlanRequest):
    stage_factor = {
        "Germination": 0.65,
        "Vegetative": 1.0,
        "Flowering": 1.25,
        "Grain Filling / Fruiting": 1.15,
        "Maturity": 0.55,
    }.get(payload.growth_stage, 1.0)

    soil_interval = {
        "Sandy": 2,
        "Red": 3,
        "Loamy": 4,
        "Black": 5,
        "Clayey": 6,
    }.get(payload.soil_type, 4)

    base_mm_per_day = 4.5 * stage_factor
    if payload.temperature_c > 34:
        base_mm_per_day *= 1.2
    elif payload.temperature_c < 22:
        base_mm_per_day *= 0.85

    net_daily_mm = max(0.0, base_mm_per_day - (payload.rain_expected_mm / max(soil_interval, 1)))
    liters_per_acre_day = round(net_daily_mm * 4046.86)
    total_liters_cycle = round(liters_per_acre_day * payload.area_acres * soil_interval)

    schedule_note = (
        "Rain expected covers crop water demand; skip irrigation until soil moisture drops."
        if net_daily_mm < 0.8
        else f"Irrigate every {soil_interval} days (prefer 6:00 AM - 8:30 AM) for ~{round(net_daily_mm * soil_interval, 1)} mm depth."
    )

    ai_tips = generate_text(
        f"Irrigation plan for {payload.crop} at {payload.growth_stage} stage in {payload.soil_type} soil "
        f"({payload.area_acres} acres, temp={payload.temperature_c}C, rain={payload.rain_expected_mm}mm). "
        f"Provide 3 short water-saving tips in {payload.language}."
    )

    return {
        "crop": payload.crop,
        "growth_stage": payload.growth_stage,
        "interval_days": soil_interval,
        "net_daily_mm": round(net_daily_mm, 2),
        "liters_per_day_total": round(liters_per_acre_day * payload.area_acres),
        "liters_per_cycle": total_liters_cycle,
        "recommendation": schedule_note,
        "ai_tips": ai_tips,
    }


@router.get("/mandi/prices")
def get_mandi_prices(
    state: Optional[str] = None,
    crop: Optional[str] = None,
):
    rows = DEMO_MANDI_PRICES
    if state and state.lower() != "all":
        rows = [r for r in rows if state.lower() in r["state"].lower()]
    if crop:
        rows = [r for r in rows if crop.lower() in r["crop"].lower()]
    return {
        "is_demo": True,
        "notice": "Reference / Demo Mandi Prices shown because live Agmarknet API key is not configured. Verify exact daily rates at enam.gov.in or your local APMC.",
        "count": len(rows),
        "prices": rows,
        "states": sorted({r["state"] for r in DEMO_MANDI_PRICES}),
    }


@router.get("/schemes")
def get_schemes(category: Optional[str] = None):
    items = GOVERNMENT_SCHEMES
    if category and category.lower() != "all":
        items = [s for s in items if category.lower() in s["category"].lower()]
    return {"schemes": items, "categories": sorted({s["category"] for s in GOVERNMENT_SCHEMES})}


@router.post("/insurance/claim-assistant")
def insurance_claim_assistant(payload: InsuranceHelpRequest):
    checklist = [
        "Report crop loss within 72 hours via PMFBY Crop Insurance App, toll-free helpline 14447, or bank/Krishi Bhavan.",
        "Take geo-tagged, date-stamped photos and short video of damaged crop rows before clearing the field.",
        "Keep PMFBY policy/application receipt, Aadhaar, bank passbook, and land record (ROR) ready.",
        "Cooperate with the joint field inspection team (Revenue + Agriculture + Insurance representative).",
    ]
    ai_letter = generate_text(
        f"Draft a short, clear crop damage intimation guide & sample claim summary in {payload.language} "
        f"for crop='{payload.crop}', cause='{payload.damage_cause}', date='{payload.damage_date}' under PMFBY."
    )
    return {"checklist": checklist, "ai_guidance": ai_letter, "helpline": "14447 (PMFBY National Helpline)"}


@router.get("/guides/organic")
def get_organic_guides():
    return {"guides": ORGANIC_GUIDES}


@router.get("/guides/equipment")
def get_equipment_guides():
    return {"equipment": EQUIPMENT_GUIDES}
