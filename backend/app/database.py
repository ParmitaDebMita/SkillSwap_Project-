from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client


def get_database():
    return get_client()[settings.database_name]


async def create_indexes():
    db = get_database()
    # Users: unique email index
    await db.users.create_index("email", unique=True)
    # Exchanges: compound indexes for fast lookups
    await db.exchanges.create_index("from_id")
    await db.exchanges.create_index("to_id")
    await db.exchanges.create_index([("from_id", 1), ("to_id", 1), ("status", 1)])


async def close_connection():
    global _client
    if _client is not None:
        _client.close()
        _client = None
