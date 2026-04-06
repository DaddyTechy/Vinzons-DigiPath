from fastapi import APIRouter, Depends
from app.database import get_db
from app.middleware.auth import require_role
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary")
async def get_summary(current_user=Depends(require_role("admin"))):
    db = get_db()

    total_docs = await db.documents.count_documents({})
    received = await db.documents.count_documents({"status": "received"})
    in_transit = await db.documents.count_documents({"status": "in_transit"})
    delivered = await db.documents.count_documents({"status": "delivered"})
    archived = await db.documents.count_documents({"status": "archived"})

    total_transmissions = await db.transmissions.count_documents({})
    pending_transmissions = await db.transmissions.count_documents({"received_by": None})

    total_users = await db.users.count_documents({})
    total_offices = await db.offices.count_documents({})

    # Documents received in last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_docs = await db.documents.count_documents({"date_received": {"$gte": week_ago}})

    # Per-office stats
    office_stats = []
    async for office in db.offices.find():
        sent = await db.transmissions.count_documents({"from_office_id": office["office_id"]})
        recv = await db.transmissions.count_documents({"to_office_id": office["office_id"]})
        office_stats.append({
            "office_id": office["office_id"],
            "name": office["name"],
            "documents_sent": sent,
            "documents_received": recv,
        })

    return {
        "total_documents": total_docs,
        "status_breakdown": {
            "received": received,
            "in_transit": in_transit,
            "delivered": delivered,
            "archived": archived,
        },
        "total_transmissions": total_transmissions,
        "pending_transmissions": pending_transmissions,
        "total_users": total_users,
        "total_offices": total_offices,
        "recent_documents_7d": recent_docs,
        "office_stats": office_stats,
    }
