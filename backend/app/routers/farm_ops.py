import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.database import db_session
from backend.app.security import get_optional_user

router = APIRouter(prefix="/api", tags=["Farm Operations & Community"])


class CalendarCreateRequest(BaseModel):
    crop_name: str = Field(..., min_length=2)
    sowing_date: str
    area_acres: float = Field(1.0, gt=0)
    soil_type: str = "Loamy"


class ProfitCalcRequest(BaseModel):
    crop_name: str = Field(..., min_length=2)
    area_acres: float = Field(..., gt=0)
    seed_cost: float = Field(0, ge=0)
    fertilizer_cost: float = Field(0, ge=0)
    labor_cost: float = Field(0, ge=0)
    irrigation_cost: float = Field(0, ge=0)
    other_cost: float = Field(0, ge=0)
    expected_yield_quintals: float = Field(..., ge=0)
    selling_price_per_quintal: float = Field(..., ge=0)


class NotificationCreateRequest(BaseModel):
    title: str = Field(..., min_length=2)
    message: str = Field(..., min_length=2)
    category: str = "reminder"
    due_date: str = ""


class PostCreateRequest(BaseModel):
    author_name: str = "Farmer"
    title: str = Field(..., min_length=3)
    content: str = Field(..., min_length=3)
    crop_tag: str = "General"
    image_data: str = ""


class CommentCreateRequest(BaseModel):
    author_name: str = "Farmer"
    content: str = Field(..., min_length=1)


@router.get("/calendar")
def list_calendars(user: Optional[dict] = Depends(get_optional_user)):
    with db_session() as conn:
        if user:
            rows = conn.execute(
                "SELECT * FROM crop_calendars WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC",
                (user["id"],),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM crop_calendars ORDER BY id DESC LIMIT 20").fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item["milestones"] = json.loads(item.pop("milestones_json", "[]"))
        result.append(item)
    return {"calendars": result}


@router.post("/calendar")
def create_calendar(
    payload: CalendarCreateRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    try:
        start = datetime.strptime(payload.sowing_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="sowing_date must be YYYY-MM-DD.")

    milestones = [
        {"stage": "Land Prep & Basal Sowing", "day": 0, "date": start.strftime("%Y-%m-%d"), "task": f"Sow treated {payload.crop_name} seeds with basal organic compost."},
        {"stage": "First Irrigation & Emergence Check", "day": 7, "date": (start + timedelta(days=7)).strftime("%Y-%m-%d"), "task": "Light morning irrigation and gap filling."},
        {"stage": "First Top-Dressing & Weeding", "day": 25, "date": (start + timedelta(days=25)).strftime("%Y-%m-%d"), "task": "Hand/rotary weeding + Nitrogen/bio-fertilizer top dressing."},
        {"stage": "Pest Monitoring & Neem Spray", "day": 45, "date": (start + timedelta(days=45)).strftime("%Y-%m-%d"), "task": "Check leaf undersides for sucking pests / borers; apply preventive neem spray."},
        {"stage": "Flowering / Panicle Irrigation", "day": 65, "date": (start + timedelta(days=65)).strftime("%Y-%m-%d"), "task": "Ensure critical moisture without waterlogging; apply potash if needed."},
        {"stage": "Pre-Harvest Readiness", "day": 100, "date": (start + timedelta(days=100)).strftime("%Y-%m-%d"), "task": "Drain excess water 10 days before harvest and check grain maturity."},
        {"stage": "Harvest & Storage", "day": 115, "date": (start + timedelta(days=115)).strftime("%Y-%m-%d"), "task": "Harvest in dry weather, sun-dry to safe moisture (<12%), and store cleanly."},
    ]
    now = datetime.utcnow().isoformat()
    uid = user["id"] if user else None
    with db_session() as conn:
        cur = conn.execute(
            """
            INSERT INTO crop_calendars (user_id, crop_name, sowing_date, area_acres, soil_type, milestones_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (uid, payload.crop_name, payload.sowing_date, payload.area_acres, payload.soil_type, json.dumps(milestones), now),
        )
        cal_id = cur.lastrowid

    return {
        "id": cal_id,
        "crop_name": payload.crop_name,
        "sowing_date": payload.sowing_date,
        "area_acres": payload.area_acres,
        "soil_type": payload.soil_type,
        "milestones": milestones,
    }


@router.delete("/calendar/{cal_id}")
def delete_calendar(cal_id: int):
    with db_session() as conn:
        conn.execute("DELETE FROM crop_calendars WHERE id = ?", (cal_id,))
    return {"deleted": cal_id}


@router.post("/calculator/profit")
def calculate_profit(
    payload: ProfitCalcRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    total_cost = round(
        payload.seed_cost
        + payload.fertilizer_cost
        + payload.labor_cost
        + payload.irrigation_cost
        + payload.other_cost,
        2,
    )
    revenue = round(payload.expected_yield_quintals * payload.selling_price_per_quintal, 2)
    profit = round(revenue - total_cost, 2)
    roi_percent = round((profit / total_cost) * 100, 1) if total_cost > 0 else 0.0
    breakeven_price = (
        round(total_cost / payload.expected_yield_quintals, 2)
        if payload.expected_yield_quintals > 0
        else 0.0
    )

    details = {
        "seed_cost": payload.seed_cost,
        "fertilizer_cost": payload.fertilizer_cost,
        "labor_cost": payload.labor_cost,
        "irrigation_cost": payload.irrigation_cost,
        "other_cost": payload.other_cost,
        "expected_yield_quintals": payload.expected_yield_quintals,
        "selling_price_per_quintal": payload.selling_price_per_quintal,
        "roi_percent": roi_percent,
        "breakeven_price": breakeven_price,
    }
    now = datetime.utcnow().isoformat()
    uid = user["id"] if user else None
    with db_session() as conn:
        conn.execute(
            """
            INSERT INTO farm_records (user_id, crop_name, area_acres, total_cost, revenue, profit, details_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (uid, payload.crop_name, payload.area_acres, total_cost, revenue, profit, json.dumps(details), now),
        )

    return {
        "crop_name": payload.crop_name,
        "area_acres": payload.area_acres,
        "total_cost": total_cost,
        "revenue": revenue,
        "profit": profit,
        "roi_percent": roi_percent,
        "breakeven_price_per_quintal": breakeven_price,
        "breakdown": details,
    }


@router.get("/calculator/history")
def profit_history(user: Optional[dict] = Depends(get_optional_user)):
    with db_session() as conn:
        if user:
            rows = conn.execute(
                "SELECT * FROM farm_records WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC LIMIT 15",
                (user["id"],),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM farm_records ORDER BY id DESC LIMIT 15").fetchall()
    return {"records": [dict(r) for r in rows]}


@router.get("/notifications")
def list_notifications(user: Optional[dict] = Depends(get_optional_user)):
    with db_session() as conn:
        if user:
            rows = conn.execute(
                "SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC",
                (user["id"],),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 30").fetchall()
    return {"notifications": [dict(r) for r in rows]}


@router.post("/notifications")
def create_notification(
    payload: NotificationCreateRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    now = datetime.utcnow().isoformat()
    uid = user["id"] if user else None
    with db_session() as conn:
        cur = conn.execute(
            """
            INSERT INTO notifications (user_id, title, message, category, due_date, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?)
            """,
            (uid, payload.title, payload.message, payload.category, payload.due_date, now),
        )
        nid = cur.lastrowid
        row = conn.execute("SELECT * FROM notifications WHERE id = ?", (nid,)).fetchone()
    return dict(row)


@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int):
    with db_session() as conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notif_id,))
    return {"id": notif_id, "is_read": 1}


@router.get("/community/posts")
def list_posts():
    with db_session() as conn:
        posts = [
            dict(r)
            for r in conn.execute("SELECT * FROM community_posts ORDER BY id DESC LIMIT 50").fetchall()
        ]
        for post in posts:
            comments = [
                dict(c)
                for c in conn.execute(
                    "SELECT * FROM community_comments WHERE post_id = ? ORDER BY id ASC",
                    (post["id"],),
                ).fetchall()
            ]
            post["comments"] = comments
    return {"posts": posts}


@router.post("/community/posts")
def create_post(
    payload: PostCreateRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    now = datetime.utcnow().isoformat()
    author = user["name"] if user else payload.author_name
    uid = user["id"] if user else None
    # Keep optional inline preview under 1.5MB
    image_data = payload.image_data if len(payload.image_data) < 1_500_000 else ""
    with db_session() as conn:
        cur = conn.execute(
            """
            INSERT INTO community_posts (user_id, author_name, title, content, crop_tag, image_data, likes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            """,
            (uid, author, payload.title, payload.content, payload.crop_tag, image_data, now),
        )
        pid = cur.lastrowid
        row = conn.execute("SELECT * FROM community_posts WHERE id = ?", (pid,)).fetchone()
    item = dict(row)
    item["comments"] = []
    return item


@router.post("/community/posts/{post_id}/like")
def like_post(post_id: int):
    with db_session() as conn:
        conn.execute("UPDATE community_posts SET likes = likes + 1 WHERE id = ?", (post_id,))
        row = conn.execute("SELECT likes FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Post not found.")
    return {"id": post_id, "likes": row["likes"]}


@router.post("/community/posts/{post_id}/comments")
def add_comment(
    post_id: int,
    payload: CommentCreateRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    now = datetime.utcnow().isoformat()
    author = user["name"] if user else payload.author_name
    uid = user["id"] if user else None
    with db_session() as conn:
        exists = conn.execute("SELECT id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Post not found.")
        cur = conn.execute(
            """
            INSERT INTO community_comments (post_id, user_id, author_name, content, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (post_id, uid, author, payload.content, now),
        )
        cid = cur.lastrowid
        row = conn.execute("SELECT * FROM community_comments WHERE id = ?", (cid,)).fetchone()
    return dict(row)
