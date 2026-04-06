from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.documents.create_index("tracking_number", unique=True)
    await db.offices.create_index("name", unique=True)
    print(f"Connected to MongoDB: {settings.database_name}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db
