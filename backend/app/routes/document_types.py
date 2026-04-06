from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.document_type import DocumentTypeCreate, DocumentTypeUpdate
import uuid

router = APIRouter(prefix="/api/document-types", tags=["Document Types"])


@router.get("/")
async def get_document_types(current_user=Depends(get_current_user)):
    db = get_db()
    types = []
    async for dt in db.document_types.find().sort("category", 1):
        types.append({
            "id": str(dt["_id"]),
            "document_type_id": dt["document_type_id"],
            "category": dt["category"],
        })
    return types


@router.post("/")
async def create_document_type(dt_data: DocumentTypeCreate, current_user=Depends(require_role("admin"))):
    db = get_db()
    existing = await db.document_types.find_one({"category": dt_data.category})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    dt_doc = {
        "document_type_id": str(uuid.uuid4())[:8].upper(),
        "category": dt_data.category,
    }
    await db.document_types.insert_one(dt_doc)
    return {"message": "Document type created", "document_type_id": dt_doc["document_type_id"]}


@router.put("/{document_type_id}")
async def update_document_type(document_type_id: str, dt_data: DocumentTypeUpdate, current_user=Depends(require_role("admin"))):
    db = get_db()
    update = {k: v for k, v in dt_data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.document_types.update_one({"document_type_id": document_type_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document type not found")
    return {"message": "Document type updated"}


@router.delete("/{document_type_id}")
async def delete_document_type(document_type_id: str, current_user=Depends(require_role("admin"))):
    db = get_db()
    result = await db.document_types.delete_one({"document_type_id": document_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document type not found")
    return {"message": "Document type deleted"}
