import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv('.env')

async def main():
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    for u in users:
        print(u.get("username"), u.get("password_hash") or u.get("password"), u.get("locked_until"))

if __name__ == "__main__":
    asyncio.run(main())
