import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from dotenv import load_dotenv
from datetime import datetime
import random

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]

def now_iso():
    return datetime.now().isoformat()

async def seed_sales_history():
    sales = []
    
    # Produk dummy untuk HPP
    produk_list = [
        {"nama": "Brosur A4", "kategori": "Printing", "jenis": "Penjualan Printing", "harga": 250000, "hpp": 150000},
        {"nama": "Spanduk 3x1m", "kategori": "Printing", "jenis": "Penjualan Printing", "harga": 150000, "hpp": 80000},
        {"nama": "Stempel Kayu", "kategori": "Advertising", "jenis": "Penjualan Advertising", "harga": 75000, "hpp": 20000},
        {"nama": "Undangan Nikah", "kategori": "Printing", "jenis": "Penjualan Printing", "harga": 2500, "hpp": 1200},
        {"nama": "Desain Logo", "kategori": "Branding", "jenis": "Penjualan Branding", "harga": 300000, "hpp": 0},
    ]

    def generate_random(year, month):
        num_sales = random.randint(10, 20)
        for i in range(num_sales):
            day = random.randint(1, 28)
            p = random.choice(produk_list)
            qty = random.randint(1, 5) if p["harga"] > 10000 else random.randint(100, 500)
            
            diskon = 0
            if random.random() > 0.8:
                diskon = random.randint(10, 50) * 1000

            total = (p["harga"] * qty) - diskon
            laba = total - (p["hpp"] * qty)
            nota_no = f"NT-{year}{month:02d}{day:02d}-{i+1:03d}"

            sales.append({
                "id": str(uuid.uuid4()),
                "nota_no": nota_no,
                "tanggal": f"{year}-{month:02d}-{day:02d}",
                "kategori": p["kategori"],
                "jenis": p["jenis"],
                "nama": p["nama"],
                "pembeli": "Dummy Customer",
                "qty": qty,
                "harga_satuan": float(p["harga"]),
                "hpp_satuan": float(p["hpp"]),
                "diskon": float(diskon),
                "total": float(total),
                "laba": float(laba),
                "status_produksi": "Selesai",
                "created_at": now_iso()
            })

    generate_random(2026, 7)
    generate_random(2026, 8)
    
    await db.sales.insert_many(sales)
    print(f"Berhasil memasukkan {len(sales)} data sales dummy yang valid untuk Juli dan Agustus 2026!")

if __name__ == "__main__":
    asyncio.run(seed_sales_history())
