from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.database import connect_db, close_db, get_db
from app.config import settings
from app.middleware.auth import hash_password
from app.utils.notifications import notification_manager

from app.routes import auth, users, offices, documents, document_types, transmissions, archives, reports


async def seed_database():
    """Seed the database with initial offices, document types, and admin user."""
    db = get_db()

    # Seed offices
    offices_data = [
        {"office_id": "MAYOR001", "name": "Office of the Mayor"},
        {"office_id": "ENGRG001", "name": "Engineering Office"},
        {"office_id": "AGRIC001", "name": "Agriculture Office"},
    ]
    for office in offices_data:
        existing = await db.offices.find_one({"office_id": office["office_id"]})
        if not existing:
            await db.offices.insert_one(office)
            print(f"  Seeded office: {office['name']}")

    # Seed document types
    doc_types = [
        {"document_type_id": "DTYPE001", "category": "Letter"},
        {"document_type_id": "DTYPE002", "category": "Memorandum"},
        {"document_type_id": "DTYPE003", "category": "Resolution"},
        {"document_type_id": "DTYPE004", "category": "Ordinance"},
        {"document_type_id": "DTYPE005", "category": "Report"},
        {"document_type_id": "DTYPE006", "category": "Request"},
        {"document_type_id": "DTYPE007", "category": "Permit"},
        {"document_type_id": "DTYPE008", "category": "Other"},
    ]
    for dt in doc_types:
        existing = await db.document_types.find_one({"document_type_id": dt["document_type_id"]})
        if not existing:
            await db.document_types.insert_one(dt)
            print(f"  Seeded document type: {dt['category']}")

    # Seed admin user (Office of the Mayor)
    admin_email = "admin@vinzons.gov"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        from datetime import datetime
        admin_user = {
            "user_id": "ADMIN001",
            "fname": "Admin",
            "lname": "Mayor",
            "mname": "",
            "email": admin_email,
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "office_id": "MAYOR001",
            "created_at": datetime.utcnow(),
        }
        await db.users.insert_one(admin_user)
        print(f"  Seeded admin user: {admin_email} / admin123")

    # Seed receptionist user (Office of the Mayor)
    recep_email = "receptionist@vinzons.gov"
    existing_recep = await db.users.find_one({"email": recep_email})
    if not existing_recep:
        from datetime import datetime
        recep_user = {
            "user_id": "RECEP001",
            "fname": "Maria",
            "lname": "Santos",
            "mname": "D",
            "email": recep_email,
            "password_hash": hash_password("recep123"),
            "role": "receptionist",
            "office_id": "MAYOR001",
            "created_at": datetime.utcnow(),
        }
        await db.users.insert_one(recep_user)
        print(f"  Seeded receptionist: {recep_email} / recep123")

    # Seed office users
    office_users = [
        {
            "user_id": "ENGR001",
            "fname": "Juan",
            "lname": "Cruz",
            "mname": "P",
            "email": "engineering@vinzons.gov",
            "password_hash": hash_password("engr123"),
            "role": "office_user",
            "office_id": "ENGRG001",
        },
        {
            "user_id": "AGRI001",
            "fname": "Ana",
            "lname": "Reyes",
            "mname": "L",
            "email": "agriculture@vinzons.gov",
            "password_hash": hash_password("agri123"),
            "role": "office_user",
            "office_id": "AGRIC001",
        },
    ]
    for ou in office_users:
        existing = await db.users.find_one({"email": ou["email"]})
        if not existing:
            from datetime import datetime
            ou["created_at"] = datetime.utcnow()
            await db.users.insert_one(ou)
            print(f"  Seeded office user: {ou['email']}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    print("Seeding database...")
    await seed_database()
    print("Database seeded!")
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Vinzon's DigiPath API",
    description="Document Tracking & Routing System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Register routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(offices.router)
app.include_router(documents.router)
app.include_router(document_types.router)
app.include_router(transmissions.router)
app.include_router(archives.router)
app.include_router(reports.router)


# WebSocket endpoint for real-time notifications
@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket, office_id: str = None):
    await notification_manager.connect(websocket, office_id)
    try:
        while True:
            # Keep connection alive, waiting for messages
            data = await websocket.receive_text()
            # Client can send ping messages to keep alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, office_id)


@app.get("/")
async def root():
    return {"message": "Vinzon's DigiPath API", "version": "1.0.0"}
