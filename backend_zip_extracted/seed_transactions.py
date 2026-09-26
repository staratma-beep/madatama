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

async def seed_transactions():
    transactions = [
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=9)).strftime("%Y-%m-%d"),
            "keterangan": "Terima pesanan Brosur A4 Toko Mulia",
            "kategori": "Pemasukan",
            "jenis": "Produksi Cetak",
            "nominal": 250000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=8)).strftime("%Y-%m-%d"),
            "keterangan": "Beli Kertas Art Paper & Tinta",
            "kategori": "Pengeluaran",
            "jenis": "Bahan Baku",
            "nominal": 120000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            "keterangan": "Pembuatan Stempel Kantor",
            "kategori": "Pemasukan",
            "jenis": "Stempel",
            "nominal": 75000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d"),
            "keterangan": "Bayar Listrik & Internet",
            "kategori": "Pengeluaran",
            "jenis": "Operasional",
            "nominal": 450000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
            "keterangan": "DP Cetak Spanduk 3x1m",
            "kategori": "Pemasukan",
            "jenis": "Banner/Spanduk",
            "nominal": 150000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d"),
            "keterangan": "Pelunasan Spanduk 3x1m",
            "kategori": "Pemasukan",
            "jenis": "Banner/Spanduk",
            "nominal": 150000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
            "keterangan": "Gaji Karyawan Shift Pagi",
            "kategori": "Pengeluaran",
            "jenis": "Gaji",
            "nominal": 800000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "keterangan": "Cetak Undangan Pernikahan (500 pcs)",
            "kategori": "Pemasukan",
            "jenis": "Undangan",
            "nominal": 1250000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "keterangan": "Uang Makan & Snack",
            "kategori": "Pengeluaran",
            "jenis": "Konsumsi",
            "nominal": 55000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        },
        {
            "id": str(uuid.uuid4()),
            "tanggal": datetime.now().strftime("%Y-%m-%d"),
            "keterangan": "Jasa Desain Logo (Toko Sembako)",
            "kategori": "Pemasukan",
            "jenis": "Jasa Desain",
            "nominal": 300000,
            "keterangan_tambahan": "",
            "auto_generated": False,
            "created_at": now_iso()
        }
    ]
    
    await db.transactions.insert_many(transactions)
    print("Berhasil memasukkan 10 data transaksi dummy!")

if __name__ == "__main__":
    asyncio.run(seed_transactions())
