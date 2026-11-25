from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.database import db_session
from backend.app.models.ml_services import get_training_metrics
from backend.app.rag.local_faiss import list_indexed_documents
from backend.app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    rate_limit,
    verify_password,
)

router = APIRouter(prefix="/api", tags=["Auth & Profile"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    phone: str = ""
    state: str = "Kerala"
    district: str = "Thrissur"
    preferred_language: str = "Hindi"
    ui_mode: str = "easy"


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    farm_size_acres: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crops: Optional[str] = None
    preferred_language: Optional[str] = None
    ui_mode: Optional[str] = None


def _get_full_profile(user_id: int) -> dict:
    with db_session() as conn:
        user = conn.execute(
            "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        profile = conn.execute(
            "SELECT * FROM farmer_profiles WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return {
            "user": dict(user) if user else None,
            "profile": dict(profile) if profile else {},
        }


@router.post("/auth/register", dependencies=[Depends(rate_limit(20, 60))])
def register(payload: RegisterRequest):
    email_clean = payload.email.strip().lower()
    now = datetime.utcnow().isoformat()
    with db_session() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (email_clean,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        # First registered account gets admin role for platform management; others get farmer
        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        role = "admin" if total_users == 0 else "farmer"

        cur = conn.execute(
            """
            INSERT INTO users (name, email, phone, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                email_clean,
                payload.phone.strip(),
                hash_password(payload.password),
                role,
                now,
            ),
        )
        user_id = cur.lastrowid
        conn.execute(
            """
            INSERT INTO farmer_profiles (
                user_id, state, district, preferred_language, ui_mode, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                payload.state,
                payload.district,
                payload.preferred_language,
                payload.ui_mode,
                now,
            ),
        )

    token = create_access_token(user_id, email_clean, role)
    data = _get_full_profile(user_id)
    return {"access_token": token, "token_type": "bearer", **data}


@router.post("/auth/login", dependencies=[Depends(rate_limit(30, 60))])
def login(payload: LoginRequest):
    email_clean = payload.email.strip().lower()
    with db_session() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, role FROM users WHERE email = ?",
            (email_clean,),
        ).fetchone()
        if not row or not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

    token = create_access_token(row["id"], row["email"], row["role"])
    data = _get_full_profile(row["id"])
    return {"access_token": token, "token_type": "bearer", **data}


@router.get("/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return _get_full_profile(user["id"])


@router.put("/profile")
def update_profile(payload: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    now = datetime.utcnow().isoformat()
    with db_session() as conn:
        if payload.name is not None or payload.phone is not None:
            conn.execute(
                """
                UPDATE users
                SET name = COALESCE(?, name), phone = COALESCE(?, phone)
                WHERE id = ?
                """,
                (payload.name, payload.phone, user["id"]),
            )
        conn.execute(
            """
            UPDATE farmer_profiles
            SET state = COALESCE(?, state),
                district = COALESCE(?, district),
                village = COALESCE(?, village),
                farm_size_acres = COALESCE(?, farm_size_acres),
                soil_type = COALESCE(?, soil_type),
                primary_crops = COALESCE(?, primary_crops),
                preferred_language = COALESCE(?, preferred_language),
                ui_mode = COALESCE(?, ui_mode),
                updated_at = ?
            WHERE user_id = ?
            """,
            (
                payload.state,
                payload.district,
                payload.village,
                payload.farm_size_acres,
                payload.soil_type,
                payload.primary_crops,
                payload.preferred_language,
                payload.ui_mode,
                now,
                user["id"],
            ),
        )
    return _get_full_profile(user["id"])


@router.get("/admin/overview")
def admin_overview():
    with db_session() as conn:
        users_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        posts_count = conn.execute("SELECT COUNT(*) FROM community_posts").fetchone()[0]
        calendars_count = conn.execute("SELECT COUNT(*) FROM crop_calendars").fetchone()[0]
        records_count = conn.execute("SELECT COUNT(*) FROM farm_records").fetchone()[0]
        notifs_count = conn.execute("SELECT COUNT(*) FROM notifications").fetchone()[0]
        recent_users = [
            dict(r)
            for r in conn.execute(
                "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 10"
            ).fetchall()
        ]

    docs_info = list_indexed_documents()
    models_info = get_training_metrics()
    return {
        "stats": {
            "total_users": users_count,
            "community_posts": posts_count,
            "crop_calendars": calendars_count,
            "profit_records": records_count,
            "notifications": notifs_count,
            "documents": docs_info["total_documents"],
            "indexed_chunks": docs_info["total_chunks"],
        },
        "models": models_info.get("models", []),
        "recent_users": recent_users,
    }
