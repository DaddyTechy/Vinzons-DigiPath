from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    fname: str = Field(..., min_length=1)
    lname: str = Field(..., min_length=1)
    mname: Optional[str] = ""
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(admin|receptionist|office_user)$")
    office_id: Optional[str] = None


class UserUpdate(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    mname: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    office_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    user_id: str
    fname: str
    lname: str
    mname: Optional[str] = ""
    email: str
    role: str
    office_id: Optional[str] = None
    office_name: Optional[str] = None
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str
