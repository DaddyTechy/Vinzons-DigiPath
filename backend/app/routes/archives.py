from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.archive import ArchiveCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/archives", tags=["Archives"])


@router.get("/")
async def get_archives(current_user=Depends(get_current_user)):
    db = get_db()
    archives = []
    async for a in db.archives.find().sort("date", -1):
        doc = await db.documents.find_one({"document_id": a["document_id"]})
        user = await db.users.find_one({"user_id": a["user_id"]})
        archives.append({
            "id": str(a["_id"]),
            "archive_id": a["archive_id"],
            "user_id": a["user_id"],
            "user_name": f"{user['fname']} {user['lname']}" if user else "Unknown",
            "document_id": a["document_id"],
            "document_subject": doc["subject"] if doc else "Unknown",
            "tracking_number": doc["tracking_number"] if doc else "Unknown",
            "date": a["date"].isoformat(),
        })
    return archives


@router.post("/")
async def create_archive(archive_data: ArchiveCreate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one({"document_id": archive_data.document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check if already archived
    existing = await db.archives.find_one({"document_id": archive_data.document_id})
    if existing:
        raise HTTPException(status_code=400, detail="Document already archived")

    archive = {
        "archive_id": str(uuid.uuid4())[:8].upper(),
        "user_id": current_user["user_id"],
        "document_id": archive_data.document_id,
        "date": datetime.utcnow(),
    }
    await db.archives.insert_one(archive)

    # Update document status
    await db.documents.update_one(
        {"document_id": archive_data.document_id},
        {"$set": {"status": "archived"}}
    )

    return {"message": "Document archived", "archive_id": archive["archive_id"]}


@router.delete("/{archive_id}")
async def delete_archive(archive_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    archive = await db.archives.find_one({"archive_id": archive_id})
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")

    # Restore document status
    await db.documents.update_one(
        {"document_id": archive["document_id"]},
        {"$set": {"status": "delivered"}}
    )

    await db.archives.delete_one({"archive_id": archive_id})
    return {"message": "Archive removed, document restored"}
