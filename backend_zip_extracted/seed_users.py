import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import bcrypt

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]

async def seed():
    count = await db.users.count_documents({})
    if count == 0:
        pw = bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode()
        users = [
            {"username": "owner", "name": "Owner Admin", "role": "Owner", "password": pw},
            {"username": "kasir", "name": "Kasir Satu", "role": "Kasir", "password": pw},
            {"username": "produksi", "name": "Tim Produksi", "role": "Produksi", "password": pw},
        ]
        await db.users.insert_many(users)
        print("Seeded 3 users: owner, kasir, produksi with password '1234'")
    else:
        print("Users already exist.")

if __name__ == "__main__":
    asyncio.run(seed())
