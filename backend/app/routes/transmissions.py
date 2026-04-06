from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.transmission import TransmissionCreate, TransmissionUpdate
from app.utils.notifications import notification_manager
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/transmissions", tags=["Transmissions"])


@router.get("/")
async def get_transmissions(current_user=Depends(get_current_user)):
    db = get_db()
    query = {}

    # Office users only see transmissions to/from their office
    if current_user["role"] == "office_user" and current_user.get("office_id"):
        query = {
            "$or": [
                {"from_office_id": current_user["office_id"]},
                {"to_office_id": current_user["office_id"]},
            ]
        }

    transmissions = []
    async for t in db.transmissions.find(query).sort("transmission_date", -1):
        doc = await db.documents.find_one({"document_id": t["document_id"]})
        from_office = await db.offices.find_one({"office_id": t["from_office_id"]})
        to_office = await db.offices.find_one({"office_id": t["to_office_id"]})
        sent_by_user = await db.users.find_one({"user_id": t["sent_by"]})
        received_by_user = None
        if t.get("received_by"):
            received_by_user = await db.users.find_one({"user_id": t["received_by"]})

        transmissions.append({
            "id": str(t["_id"]),
            "transmission_id": t["transmission_id"],
            "document_id": t["document_id"],
            "document_subject": doc["subject"] if doc else "Unknown",
            "tracking_number": doc["tracking_number"] if doc else "Unknown",
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
    return transmissions


@router.post("/")
async def create_transmission(t_data: TransmissionCreate, current_user=Depends(get_current_user)):
    db = get_db()

    # Verify document exists
    doc = await db.documents.find_one({"document_id": t_data.document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Verify offices exist
    from_office = await db.offices.find_one({"office_id": t_data.from_office_id})
    to_office = await db.offices.find_one({"office_id": t_data.to_office_id})
    if not from_office or not to_office:
        raise HTTPException(status_code=404, detail="Office not found")

    transmission = {
        "transmission_id": str(uuid.uuid4())[:8].upper(),
        "document_id": t_data.document_id,
        "from_office_id": t_data.from_office_id,
        "to_office_id": t_data.to_office_id,
        "sent_by": current_user["user_id"],
        "received_by": None,
        "transmission_date": datetime.utcnow(),
        "transmission_type": t_data.transmission_type,
    }

    await db.transmissions.insert_one(transmission)

    # Update document status
    await db.documents.update_one(
        {"document_id": t_data.document_id},
        {"$set": {"status": "in_transit"}}
    )

    # Send real-time notification to destination office
    await notification_manager.notify_document_event(
        "document_incoming",
        {
            "tracking_number": doc["tracking_number"],
            "subject": doc["subject"],
            "from_office": from_office["name"],
            "to_office": to_office["name"],
            "transmission_type": t_data.transmission_type,
        },
        office_ids=[t_data.to_office_id]
    )

    return {"message": "Transmission created", "transmission_id": transmission["transmission_id"]}


@router.post("/{transmission_id}/receive")
async def receive_transmission(transmission_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    transmission = await db.transmissions.find_one({"transmission_id": transmission_id})
    if not transmission:
        raise HTTPException(status_code=404, detail="Transmission not found")

    if transmission.get("received_by"):
        raise HTTPException(status_code=400, detail="Already received")

    # Office users can only receive transmissions to their office
    if current_user["role"] == "office_user":
        if current_user.get("office_id") != transmission["to_office_id"]:
            raise HTTPException(status_code=403, detail="You can only receive documents sent to your office")

    await db.transmissions.update_one(
        {"transmission_id": transmission_id},
        {"$set": {"received_by": current_user["user_id"]}}
    )

    # Check if all transmissions for this doc are received -> update doc status
    doc = await db.documents.find_one({"document_id": transmission["document_id"]})
    pending = await db.transmissions.count_documents({
        "document_id": transmission["document_id"],
        "received_by": None
    })

    if pending == 0:
        await db.documents.update_one(
            {"document_id": transmission["document_id"]},
            {"$set": {"status": "delivered"}}
        )

    # Notify sender office
    from_office = await db.offices.find_one({"office_id": transmission["from_office_id"]})
    to_office = await db.offices.find_one({"office_id": transmission["to_office_id"]})

    await notification_manager.notify_document_event(
        "document_received",
        {
            "tracking_number": doc["tracking_number"] if doc else "Unknown",
            "subject": doc["subject"] if doc else "Unknown",
            "received_by": f"{current_user['fname']} {current_user['lname']}",
            "office": to_office["name"] if to_office else "Unknown",
        },
        office_ids=[transmission["from_office_id"]]
    )

    return {"message": "Transmission received"}


@router.delete("/{transmission_id}")
async def delete_transmission(transmission_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db.transmissions.delete_one({"transmission_id": transmission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transmission not found")
    return {"message": "Transmission deleted"}
