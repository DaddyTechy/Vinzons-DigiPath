from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TransmissionCreate(BaseModel):
    document_id: str
    from_office_id: str
    to_office_id: str
    transmission_type: str = Field(default="hand_carry", pattern="^(hand_carry|courier|email|fax)$")


class TransmissionUpdate(BaseModel):
    received_by: Optional[str] = None
    transmission_type: Optional[str] = None


class TransmissionResponse(BaseModel):
    id: str
    transmission_id: str
    document_id: str
    document_subject: Optional[str] = None
    tracking_number: Optional[str] = None
    from_office_id: str
    from_office_name: Optional[str] = None
    to_office_id: str
    to_office_name: Optional[str] = None
    sent_by: str
    sent_by_name: Optional[str] = None
    received_by: Optional[str] = None
    received_by_name: Optional[str] = None
    transmission_date: datetime
    transmission_type: str
    status: Optional[str] = "pending"
