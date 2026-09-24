import asyncio
import os
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from auth_security import get_password_hash
from datetime import datetime

# Load environment variables
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

# Hubungkan ke MongoDB
db = AsyncIOMotorClient(os.getenv("MONGO_URL"))[os.getenv("DB_NAME")]

def now_iso():
    return datetime.now().isoformat()

async def seed_users():
    print("Menjalankan seeder akun pengguna (Enterprise)...")
    
    # Baca kredensial murni dari Environment Variables ! PENTING (Security Issue #1)
    # Anda perlu mendefinisikan ini di .env sebelum menjalankan skrip.
    owner_pass = os.getenv("DEFAULT_OWNER_PASS", "Owner!Secure123@#")
    produksi_pass = os.getenv("DEFAULT_PRODUKSI_PASS", "Produksi890#@!")
    kasir_pass = os.getenv("DEFAULT_KASIR_PASS", "KasirTangguh123!")

    # Daftar Akun
    users_to_seed = [
        {
            "username": "owner_admin",
            "name": "Owner Admin",
            "password": owner_pass,
            "role": "Owner",
            "must_change_password": False # Owner bebas
        },
        {
            "username": "staf_produksi",
            "name": "Staf Produksi",
            "password": produksi_pass,
            "role": "Produksi",
            "must_change_password": True # Force change pada login pertama
        },
        {
            "username": "kasir_utama",
            "name": "Kasir Utama",
            "password": kasir_pass,
            "role": "Kasir",
            "must_change_password": True # Force change pada login pertama
        }
    ]

    for u in users_to_seed:
        existing = await db.users.find_one({"username": u["username"]})
        if not existing:
            hash_pw = get_password_hash(u["password"])
            new_user = {
                "id": str(uuid.uuid4()),
                "username": u["username"],
                "password_hash": hash_pw,
                "name": u["name"],
                "role": u["role"],
                "is_active": True,
                "must_change_password": u["must_change_password"],
                "created_at": now_iso(),
                "failed_login_attempts": 0,
                "locked_until": None
            }
            await db.users.insert_one(new_user)
            print(f"[+] Berhasil membuat akun (role: {u['role']}) -> {u['username']}")
        else:
            print(f"[.] Akun {u['username']} sudah ada di database, skip.")
            
    print("Seeding selesai.")

if __name__ == "__main__":
    asyncio.run(seed_users())
