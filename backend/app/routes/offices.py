from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.office import OfficeCreate, OfficeUpdate
import uuid

router = APIRouter(prefix="/api/offices", tags=["Offices"])


@router.get("/")
async def get_offices(current_user=Depends(get_current_user)):
    db = get_db()
    offices = []
    async for office in db.offices.find().sort("name", 1):
        offices.append({
            "id": str(office["_id"]),
            "office_id": office["office_id"],
            "name": office["name"],
        })
    return offices


@router.get("/{office_id}")
async def get_office(office_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    office = await db.offices.find_one({"office_id": office_id})
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    return {
        "id": str(office["_id"]),
        "office_id": office["office_id"],
        "name": office["name"],
    }


@router.post("/")
async def create_office(office_data: OfficeCreate, current_user=Depends(require_role("admin"))):
    db = get_db()
    existing = await db.offices.find_one({"name": office_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Office already exists")

    office_doc = {
        "office_id": str(uuid.uuid4())[:8].upper(),
        "name": office_data.name,
    }
    await db.offices.insert_one(office_doc)
    return {"message": "Office created", "office_id": office_doc["office_id"]}


@router.put("/{office_id}")
async def update_office(office_id: str, office_data: OfficeUpdate, current_user=Depends(require_role("admin"))):
    db = get_db()
    update = {k: v for k, v in office_data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.offices.update_one({"office_id": office_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Office not found")
    return {"message": "Office updated"}


@router.delete("/{office_id}")
async def delete_office(office_id: str, current_user=Depends(require_role("admin"))):
    db = get_db()
    result = await db.offices.delete_one({"office_id": office_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Office not found")
    return {"message": "Office deleted"}
