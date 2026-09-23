import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]

def now_iso():
    return datetime.now().isoformat()

async def seed_history():
    transactions = []
    
    # Kategori dan Jenis yang logis
    pemasukan_jenis = ["Banner/Spanduk", "Stempel", "Undangan", "Brosur/Flyer", "Kartu Nama", "Jasa Desain"]
    pengeluaran_jenis = ["Bahan/Mitra", "Operasional", "Gaji", "Pajak", "Lain-lain", "Bahan Baku", "Konsumsi"]

    # Fungsi untuk generate random transaction
    def generate_random(year, month):
        num_transactions = random.randint(15, 25) # 15-25 trx per bulan
        for _ in range(num_transactions):
            day = random.randint(1, 28) # sampai 28 aja aman
            is_pemasukan = random.choice([True, True, False]) # 66% pemasukan
            
            if is_pemasukan:
                kategori = "Pemasukan"
                jenis = random.choice(pemasukan_jenis)
                nominal = random.randint(50, 2500) * 1000 # 50k - 2.5m
                keterangan = f"Order {jenis} (Dummy)"
            else:
                kategori = "Pengeluaran"
                jenis = random.choice(pengeluaran_jenis)
                nominal = random.randint(20, 1000) * 1000 # 20k - 1m
                keterangan = f"Pengeluaran {jenis} (Dummy)"
            
            transactions.append({
                "id": str(uuid.uuid4()),
                "tanggal": f"{year}-{month:02d}-{day:02d}",
                "keterangan": keterangan,
                "kategori": kategori,
                "jenis": jenis,
                "nominal": nominal,
                "keterangan_tambahan": "",
                "auto_generated": False,
                "created_at": now_iso()
            })

    # Generate untuk Juli (07) dan Agustus (08)
    generate_random(2026, 7)
    generate_random(2026, 8)
    
    await db.transactions.insert_many(transactions)
    print(f"Berhasil memasukkan {len(transactions)} data transaksi dummy untuk Juli dan Agustus 2026!")

if __name__ == "__main__":
    asyncio.run(seed_history())
