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
    # Messages: index on exchange_id and timestamp
    await db.messages.create_index([("exchange_id", 1), ("timestamp", 1)])
    await db.messages.create_index("sender_id")
    await db.messages.create_index("receiver_id")
    # Connections: index on exchange_id
    await db.connections.create_index("exchange_id", unique=True)
    await db.connections.create_index([("user1_id", 1), ("user2_id", 1)])
    # Notifications: index on user_id and timestamp
    await db.notifications.create_index([("user_id", 1), ("timestamp", -1)])
    # Reviews: compound unique index preventing duplicate reviews per exchange
    await db.reviews.create_index([("exchange_id", 1), ("reviewer_id", 1)], unique=True)
    await db.reviews.create_index("reviewee_id")
    # Reports
    await db.reports.create_index("reported_user_id")


async def close_connection():
    global _client
    if _client is not None:
        _client.close()
        _client = None
