from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.app.models.ml_services import (
    analyze_image_with_ai,
    analyze_soil_and_fertilizer,
    get_training_metrics,
    recommend_crops,
    recommend_seeds,
)
from backend.app.security import rate_limit, validate_image_upload

router = APIRouter(prefix="/api", tags=["AI & ML Advisory"])


class CropRecommendRequest(BaseModel):
    n: float = Field(..., ge=0, le=300)
    p: float = Field(..., ge=0, le=300)
    k: float = Field(..., ge=0, le=300)
    temperature: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0, le=3000)
    language: str = "Hindi"


class SeedRecommendRequest(BaseModel):
    crop: str = Field(..., min_length=2)
    soil_type: str = "Loamy"
    season: str = "Kharif"
    water_availability: str = "Medium"
    state: str = "Kerala"
    language: str = "Hindi"


class SoilAnalyzeRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=300)
    phosphorus: float = Field(..., ge=0, le=300)
    potassium: float = Field(..., ge=0, le=300)
    ph: float = Field(..., ge=0, le=14)
    moisture: float = Field(45.0, ge=0, le=100)
    temperature: float = Field(28.0, ge=-10, le=60)
    humidity: float = Field(65.0, ge=0, le=100)
    soil_type: str = "Loamy"
    crop_type: str = "Paddy"
    language: str = "Hindi"


@router.post("/recommend/crop", dependencies=[Depends(rate_limit(60, 60))])
def api_recommend_crop(payload: CropRecommendRequest):
    try:
        return recommend_crops(
            n=payload.n,
            p=payload.p,
            k=payload.k,
            temperature=payload.temperature,
            humidity=payload.humidity,
            ph=payload.ph,
            rainfall=payload.rainfall,
            language=payload.language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend/seed", dependencies=[Depends(rate_limit(60, 60))])
def api_recommend_seed(payload: SeedRecommendRequest):
    return recommend_seeds(
        crop=payload.crop,
        soil_type=payload.soil_type,
        season=payload.season,
        water_availability=payload.water_availability,
        state=payload.state,
        language=payload.language,
    )


@router.post("/soil/analyze", dependencies=[Depends(rate_limit(60, 60))])
def api_analyze_soil(payload: SoilAnalyzeRequest):
    return analyze_soil_and_fertilizer(
        nitrogen=payload.nitrogen,
        phosphorus=payload.phosphorus,
        potassium=payload.potassium,
        ph=payload.ph,
        moisture=payload.moisture,
        temperature=payload.temperature,
        humidity=payload.humidity,
        soil_type=payload.soil_type,
        crop_type=payload.crop_type,
        language=payload.language,
    )


@router.post("/soil/analyze-image", dependencies=[Depends(rate_limit(30, 60))])
async def api_analyze_soil_image(
    file: UploadFile = File(...),
    language: str = Form("Hindi"),
):
    content, ext, quality = await validate_image_upload(file)
    mime = f"image/{'jpeg' if ext in {'.jpg', '.jpeg'} else ext.lstrip('.')}"
    return analyze_image_with_ai(
        image_bytes=content,
        mime_type=mime,
        mode="soil",
        language=language,
        quality_info=quality,
    )


@router.post("/pest/identify", dependencies=[Depends(rate_limit(30, 60))])
async def api_identify_pest(
    file: UploadFile = File(...),
    language: str = Form("Hindi"),
):
    content, ext, quality = await validate_image_upload(file)
    mime = f"image/{'jpeg' if ext in {'.jpg', '.jpeg'} else ext.lstrip('.')}"
    return analyze_image_with_ai(
        image_bytes=content,
        mime_type=mime,
        mode="pest",
        language=language,
        quality_info=quality,
    )


@router.get("/models/metrics")
def api_model_metrics():
    return get_training_metrics()
