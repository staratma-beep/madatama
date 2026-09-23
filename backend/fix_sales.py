import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from dotenv import load_dotenv

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]

async def fix():
    # Remove bad sales items
    res = await db.sales.delete_many({"harga": {"$exists": True}})
    print("Deleted", res.deleted_count, "bad dummy sales")

if __name__ == "__main__":
    asyncio.run(fix())
