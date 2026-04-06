from pydantic import BaseModel, Field
from typing import Optional


class DocumentTypeCreate(BaseModel):
    category: str = Field(..., min_length=1)


class DocumentTypeUpdate(BaseModel):
    category: Optional[str] = None


class DocumentTypeResponse(BaseModel):
    id: str
    document_type_id: str
    category: str
