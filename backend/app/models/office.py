from pydantic import BaseModel, Field
from typing import Optional


class OfficeCreate(BaseModel):
    name: str = Field(..., min_length=1)


class OfficeUpdate(BaseModel):
    name: Optional[str] = None


class OfficeResponse(BaseModel):
    id: str
    office_id: str
    name: str
