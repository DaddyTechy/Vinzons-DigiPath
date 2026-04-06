from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ArchiveCreate(BaseModel):
    document_id: str


class ArchiveResponse(BaseModel):
    id: str
    archive_id: str
    user_id: str
    user_name: Optional[str] = None
    document_id: str
    document_subject: Optional[str] = None
    tracking_number: Optional[str] = None
    date: datetime
