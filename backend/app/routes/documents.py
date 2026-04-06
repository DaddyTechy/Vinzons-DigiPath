from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.document import DocumentCreate, DocumentUpdate
from app.utils.tracking import generate_tracking_number
from app.utils.notifications import notification_manager
from app.config import settings
from datetime import datetime
import uuid
import os
import shutil

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("/")
async def get_documents(current_user=Depends(get_current_user)):
    db = get_db()
    documents = []
    async for doc in db.documents.find().sort("date_received", -1):
        # Get document type name
        doc_type_name = None
        if doc.get("document_type_id"):
            doc_type = await db.document_types.find_one({"document_type_id": doc["document_type_id"]})
            if doc_type:
                doc_type_name = doc_type["category"]

        # Get creator name
        creator_name = None
        if doc.get("created_by"):
            creator = await db.users.find_one({"user_id": doc["created_by"]})
            if creator:
                creator_name = f"{creator['fname']} {creator['lname']}"

        documents.append({
            "id": str(doc["_id"]),
            "document_id": doc["document_id"],
            "tracking_number": doc["tracking_number"],
            "subject": doc["subject"],
            "document_direction": doc["document_direction"],
            "status": doc["status"],
            "date_received": doc["date_received"].isoformat() if doc.get("date_received") else None,
            "document_type_id": doc.get("document_type_id"),
            "document_type_name": doc_type_name,
            "scanned_copy_path": doc.get("scanned_copy_path"),
            "sender_name": doc.get("sender_name", ""),
            "remarks": doc.get("remarks", ""),
            "created_by": doc.get("created_by"),
            "created_by_name": creator_name,
        })
    return documents


@router.get("/track/{tracking_number}")
async def track_document(tracking_number: str):
    """Public endpoint - no auth required"""
    db = get_db()
    doc = await db.documents.find_one({"tracking_number": tracking_number})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get transmission history
    transmissions = []
    async for t in db.transmissions.find({"document_id": doc["document_id"]}).sort("transmission_date", 1):
        from_office = await db.offices.find_one({"office_id": t["from_office_id"]})
        to_office = await db.offices.find_one({"office_id": t["to_office_id"]})
        sent_by_user = await db.users.find_one({"user_id": t["sent_by"]})
        received_by_user = None
        if t.get("received_by"):
            received_by_user = await db.users.find_one({"user_id": t["received_by"]})

        transmissions.append({
            "transmission_id": t["transmission_id"],
            "from_office": from_office["name"] if from_office else "Unknown",
            "to_office": to_office["name"] if to_office else "Unknown",
            "sent_by": f"{sent_by_user['fname']} {sent_by_user['lname']}" if sent_by_user else "Unknown",
            "received_by": f"{received_by_user['fname']} {received_by_user['lname']}" if received_by_user else None,
            "transmission_date": t["transmission_date"].isoformat(),
            "transmission_type": t["transmission_type"],
            "status": "received" if t.get("received_by") else "pending",
        })

    doc_type_name = None
    if doc.get("document_type_id"):
        doc_type = await db.document_types.find_one({"document_type_id": doc["document_type_id"]})
        if doc_type:
            doc_type_name = doc_type["category"]

    return {
        "tracking_number": doc["tracking_number"],
        "subject": doc["subject"],
        "status": doc["status"],
        "document_direction": doc["document_direction"],
        "date_received": doc["date_received"].isoformat() if doc.get("date_received") else None,
        "document_type": doc_type_name,
        "sender_name": doc.get("sender_name", ""),
        "transmissions": transmissions,
    }


@router.get("/{document_id}")
async def get_document(document_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_type_name = None
    if doc.get("document_type_id"):
        doc_type = await db.document_types.find_one({"document_type_id": doc["document_type_id"]})
        if doc_type:
            doc_type_name = doc_type["category"]

    creator_name = None
    if doc.get("created_by"):
        creator = await db.users.find_one({"user_id": doc["created_by"]})
        if creator:
            creator_name = f"{creator['fname']} {creator['lname']}"

    # Get transmissions
    transmissions = []
    async for t in db.transmissions.find({"document_id": document_id}).sort("transmission_date", 1):
        from_office = await db.offices.find_one({"office_id": t["from_office_id"]})
        to_office = await db.offices.find_one({"office_id": t["to_office_id"]})
        sent_by_user = await db.users.find_one({"user_id": t["sent_by"]})
        received_by_user = None
        if t.get("received_by"):
            received_by_user = await db.users.find_one({"user_id": t["received_by"]})

        transmissions.append({
            "transmission_id": t["transmission_id"],
            "from_office_id": t["from_office_id"],
            "from_office_name": from_office["name"] if from_office else "Unknown",
            "to_office_id": t["to_office_id"],
            "to_office_name": to_office["name"] if to_office else "Unknown",
            "sent_by": t["sent_by"],
            "sent_by_name": f"{sent_by_user['fname']} {sent_by_user['lname']}" if sent_by_user else "Unknown",
            "received_by": t.get("received_by"),
            "received_by_name": f"{received_by_user['fname']} {received_by_user['lname']}" if received_by_user else None,
            "transmission_date": t["transmission_date"].isoformat(),
            "transmission_type": t["transmission_type"],
            "status": "received" if t.get("received_by") else "pending",
        })

    return {
        "id": str(doc["_id"]),
        "document_id": doc["document_id"],
        "tracking_number": doc["tracking_number"],
        "subject": doc["subject"],
        "document_direction": doc["document_direction"],
        "status": doc["status"],
        "date_received": doc["date_received"].isoformat() if doc.get("date_received") else None,
        "document_type_id": doc.get("document_type_id"),
        "document_type_name": doc_type_name,
        "scanned_copy_path": doc.get("scanned_copy_path"),
        "sender_name": doc.get("sender_name", ""),
        "remarks": doc.get("remarks", ""),
        "created_by": doc.get("created_by"),
        "created_by_name": creator_name,
        "transmissions": transmissions,
    }


@router.post("/")
async def create_document(doc_data: DocumentCreate, current_user=Depends(get_current_user)):
    db = get_db()

    # Generate unique tracking number
    tracking_number = generate_tracking_number()
    while await db.documents.find_one({"tracking_number": tracking_number}):
        tracking_number = generate_tracking_number()

    doc = {
        "document_id": str(uuid.uuid4())[:8].upper(),
        "tracking_number": tracking_number,
        "subject": doc_data.subject,
        "document_direction": doc_data.document_direction,
        "status": "received",
        "date_received": datetime.utcnow(),
        "document_type_id": doc_data.document_type_id,
        "scanned_copy_path": None,
        "sender_name": doc_data.sender_name or "",
        "remarks": doc_data.remarks or "",
        "created_by": current_user["user_id"],
    }

    await db.documents.insert_one(doc)

    # Notify all connected clients
    await notification_manager.notify_document_event(
        "document_created",
        {"tracking_number": tracking_number, "subject": doc_data.subject, "status": "received"}
    )

    return {"message": "Document created", "document_id": doc["document_id"], "tracking_number": tracking_number}


@router.put("/{document_id}")
async def update_document(document_id: str, doc_data: DocumentUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in doc_data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.documents.update_one({"document_id": document_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document updated"}


@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user=Depends(require_role("admin"))):
    db = get_db()
    result = await db.documents.delete_one({"document_id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}


@router.post("/{document_id}/upload")
async def upload_scan(document_id: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Create uploads dir if needed
    os.makedirs(settings.upload_dir, exist_ok=True)

    # Save file
    ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
    filename = f"{document_id}_{uuid.uuid4().hex[:6]}{ext}"
    filepath = os.path.join(settings.upload_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    await db.documents.update_one(
        {"document_id": document_id},
        {"$set": {"scanned_copy_path": filename}}
    )

    return {"message": "File uploaded", "filename": filename}
