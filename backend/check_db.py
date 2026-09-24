import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]

async def check():
    users = await db.users.find({}).to_list(100)
    for u in users:
        print(f"Username: {u.get('username')}")
        print(f"Password field: {u.get('password')}")
        print(f"Password_hash field: {u.get('password_hash')}")
        print(f"Is active: {u.get('is_active')}")
        print("---")

if __name__ == "__main__":
    asyncio.run(check())
