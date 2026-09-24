import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv('.env')
db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TEST_PASSWORDS = {
    "owner_admin": "Owner!Secure123@#",
    "staf_produksi": "Produksi890#@!",
    "kasir_utama": "KasirTangguh123!",
    "owner": "1234",
    "kasir": "1234",
    "produksi": "1234",
}

async def main():
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    results = []
    for u in users:
        username = u.get('username')
        ph = u.get("password_hash") or u.get("password", "")
        role = u.get("role", "?")
        active = u.get("is_active", "missing")
        pw = TEST_PASSWORDS.get(username, "")
        verified = None
        if pw and ph:
            try:
                verified = pwd_context.verify(pw, ph)
            except Exception as ex:
                verified = f"ERROR:{ex}"
        results.append(f"{username}|{role}|active={active}|verify={verified}")
    
    with open("verify_result.txt", "w") as f:
        f.write("\n".join(results))
    print("DONE - see verify_result.txt")

asyncio.run(main())
