from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DocumentCreate(BaseModel):
    subject: str = Field(..., min_length=1)
    document_direction: str = Field(..., pattern="^(incoming|outgoing)$")
    document_type_id: str
    sender_name: Optional[str] = ""
    remarks: Optional[str] = ""


class DocumentUpdate(BaseModel):
    subject: Optional[str] = None
    document_direction: Optional[str] = None
    status: Optional[str] = None
    document_type_id: Optional[str] = None
    sender_name: Optional[str] = None
    remarks: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    document_id: str
    tracking_number: str
    subject: str
    document_direction: str
    status: str
    date_received: datetime
    document_type_id: str
    document_type_name: Optional[str] = None
    scanned_copy_path: Optional[str] = None
    sender_name: Optional[str] = ""
    remarks: Optional[str] = ""
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
