from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user, require_role, hash_password
from app.models.user import UserCreate, UserUpdate, UserResponse
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/")
async def get_users(current_user=Depends(require_role("admin"))):
    db = get_db()
    users = []
    async for user in db.users.find().sort("created_at", -1):
        office_name = None
        if user.get("office_id"):
            office = await db.offices.find_one({"office_id": user["office_id"]})
            if office:
                office_name = office["name"]
        users.append({
            "id": str(user["_id"]),
            "user_id": user["user_id"],
            "fname": user["fname"],
            "lname": user["lname"],
            "mname": user.get("mname", ""),
            "email": user["email"],
            "role": user["role"],
            "office_id": user.get("office_id"),
            "office_name": office_name,
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
        })
    return users


@router.post("/")
async def create_user(user_data: UserCreate, current_user=Depends(require_role("admin"))):
    db = get_db()
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user_doc = {
        "user_id": str(uuid.uuid4())[:8].upper(),
        "fname": user_data.fname,
        "lname": user_data.lname,
        "mname": user_data.mname or "",
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "office_id": user_data.office_id,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    return {"message": "User created", "user_id": user_doc["user_id"]}


@router.put("/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, current_user=Depends(require_role("admin"))):
    db = get_db()
    update = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if "password" in update:
        update["password_hash"] = hash_password(update.pop("password"))
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.users.update_one({"user_id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user=Depends(require_role("admin"))):
    db = get_db()
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
