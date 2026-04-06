from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import LoginRequest, UserCreate, UserResponse
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
async def login(request: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": user["user_id"], "role": user["role"]})

    # Get office name
    office_name = None
    if user.get("office_id"):
        office = await db.offices.find_one({"office_id": user["office_id"]})
        if office:
            office_name = office["name"]

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "user_id": user["user_id"],
            "fname": user["fname"],
            "lname": user["lname"],
            "email": user["email"],
            "role": user["role"],
            "office_id": user.get("office_id"),
            "office_name": office_name,
        }
    }


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    db = get_db()
    office_name = None
    if current_user.get("office_id"):
        office = await db.offices.find_one({"office_id": current_user["office_id"]})
        if office:
            office_name = office["name"]

    return {
        "id": str(current_user["_id"]),
        "user_id": current_user["user_id"],
        "fname": current_user["fname"],
        "lname": current_user["lname"],
        "mname": current_user.get("mname", ""),
        "email": current_user["email"],
        "role": current_user["role"],
        "office_id": current_user.get("office_id"),
        "office_name": office_name,
    }
