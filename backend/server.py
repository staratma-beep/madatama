from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

WIB = timezone(timedelta(hours=7))


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------- Models ----------------
class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tanggal: str
    keterangan: str
    kategori: str  # "Pemasukan" | "Pengeluaran"
    jenis: str
    nominal: float
    keterangan_tambahan: Optional[str] = ""
    auto_generated: bool = False
    source_record_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class TransactionCreate(BaseModel):
    tanggal: str
    keterangan: str
    kategori: str
    jenis: str
    nominal: float
    keterangan_tambahan: Optional[str] = ""


class Record(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tanggal: str
    jenis: str  # "Piutang" | "Utang"
    nama: str
    keterangan: Optional[str] = ""
    nominal: float
    status: str = "Belum Lunas"  # "Belum Lunas" | "Lunas"
    transaction_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class RecordCreate(BaseModel):
    tanggal: str
    jenis: str
    nama: str
    keterangan: Optional[str] = ""
    nominal: float
    status: str = "Belum Lunas"


class ProfitShare(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bulan: str  # "YYYY-MM"
    laba_bersih: float = 0
    bagian_pemilik: float = 0
    bagian_pengelola: float = 0
    created_at: str = Field(default_factory=now_iso)


class ProfitShareCreate(BaseModel):
    bulan: str
    laba_bersih: float = 0
    bagian_pemilik: float = 0
    bagian_pengelola: float = 0


class Settings(BaseModel):
    saldo_awal: float = 0


DEFAULT_FIXED_COSTS = [
    {"nama": "KUR", "nominal": 1600000},
    {"nama": "Internet", "nominal": 400000},
    {"nama": "Listrik", "nominal": 400000},
    {"nama": "Operasional", "nominal": 750000},
]


class FixedCost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    nominal: float


class FixedCostCreate(BaseModel):
    nama: str
    nominal: float


_PRODUCT_SEED = {
    "Branding": ["Kaos Polos", "Sablon Kaos", "Mug", "Lanyard", "Gantungan Kunci Lanyard", "Sablon Topi", "Sablon Jersey", "Totebag", "Name Tag"],
    "Printing": ["Spanduk", "Brosur", "A3", "Stiker", "Undangan", "PIN", "Bendera/Umbul-umbul"],
    "Advertising": ["Neon Box", "Akrilik", "Cutting Stiker"],
}


class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kategori: str
    nama: str
    jenis: str = "Sendiri"
    bahan_baku: float = 0
    jasa_mitra: float = 0
    tambahan: float = 0
    harga_jual: float = 0
    urutan: int = 0


class ProductCreate(BaseModel):
    kategori: str
    nama: str
    jenis: str = "Sendiri"
    bahan_baku: float = 0
    jasa_mitra: float = 0
    tambahan: float = 0
    harga_jual: float = 0


_SALE_JENIS = {"Branding": "Penjualan Branding", "Printing": "Penjualan Printing", "Advertising": "Penjualan Advertising"}


class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nota_no: str
    tanggal: str
    nama: str
    kategori: str
    jenis: str
    pembeli: Optional[str] = ""
    qty: int = 1
    harga_satuan: float = 0
    hpp_satuan: float = 0
    diskon: float = 0
    total: float = 0
    laba: float = 0
    product_id: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class SaleCreate(BaseModel):
    nama: str
    kategori: str
    qty: int = 1
    harga_satuan: float = 0
    hpp_satuan: float = 0
    diskon: float = 0
    pembeli: Optional[str] = ""
    product_id: Optional[str] = None
    tanggal: Optional[str] = None


class BackupData(BaseModel):
    transactions: List[dict] = []
    records: List[dict] = []
    profit_shares: List[dict] = []
    fixed_costs: List[dict] = []
    products: List[dict] = []
    sales: List[dict] = []
    settings: dict = {}


# ---------------- Transactions ----------------
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    docs = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    return docs


@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    obj = Transaction(**input.model_dump())
    await db.transactions.insert_one(obj.model_dump())
    return obj


@api_router.put("/transactions/{tid}", response_model=Transaction)
async def update_transaction(tid: str, input: TransactionCreate):
    existing = await db.transactions.find_one({"id": tid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    updated = {**existing, **input.model_dump()}
    await db.transactions.replace_one({"id": tid}, updated)
    return updated


@api_router.delete("/transactions/{tid}")
async def delete_transaction(tid: str):
    await db.transactions.delete_one({"id": tid})
    return {"ok": True}


# ---------------- Records (Piutang & Utang) ----------------
@api_router.get("/records", response_model=List[Record])
async def get_records():
    docs = await db.records.find({}, {"_id": 0}).to_list(10000)
    return docs


@api_router.post("/records", response_model=Record)
async def create_record(input: RecordCreate):
    obj = Record(**input.model_dump())
    await db.records.insert_one(obj.model_dump())
    return obj


@api_router.put("/records/{rid}", response_model=Record)
async def update_record(rid: str, input: RecordCreate):
    existing = await db.records.find_one({"id": rid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Catatan tidak ditemukan")
    updated = {**existing, **input.model_dump()}
    await db.records.replace_one({"id": rid}, updated)
    return updated


@api_router.post("/records/{rid}/settle", response_model=Record)
async def settle_record(rid: str):
    rec = await db.records.find_one({"id": rid}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Catatan tidak ditemukan")
    if rec["status"] == "Lunas":
        return rec
    # create auto transaction in cash book
    if rec["jenis"] == "Piutang":
        kategori = "Pemasukan"
        keterangan = f"Pelunasan Piutang: {rec['nama']}"
    else:
        kategori = "Pengeluaran"
        keterangan = f"Pembayaran Utang: {rec['nama']}"
    txn = Transaction(
        tanggal=datetime.now(WIB).strftime("%Y-%m-%d"),
        keterangan=keterangan,
        kategori=kategori,
        jenis="Lain-lain",
        nominal=rec["nominal"],
        keterangan_tambahan=rec.get("keterangan", ""),
        auto_generated=True,
        source_record_id=rid,
    )
    await db.transactions.insert_one(txn.model_dump())
    rec["status"] = "Lunas"
    rec["transaction_id"] = txn.id
    await db.records.replace_one({"id": rid}, rec)
    return rec


@api_router.post("/records/{rid}/unsettle", response_model=Record)
async def unsettle_record(rid: str):
    rec = await db.records.find_one({"id": rid}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Catatan tidak ditemukan")
    if rec.get("transaction_id"):
        await db.transactions.delete_one({"id": rec["transaction_id"]})
    rec["status"] = "Belum Lunas"
    rec["transaction_id"] = None
    await db.records.replace_one({"id": rid}, rec)
    return rec


@api_router.delete("/records/{rid}")
async def delete_record(rid: str):
    rec = await db.records.find_one({"id": rid}, {"_id": 0})
    if rec and rec.get("transaction_id"):
        await db.transactions.delete_one({"id": rec["transaction_id"]})
    await db.records.delete_one({"id": rid})
    return {"ok": True}


# ---------------- Profit Shares ----------------
@api_router.get("/profit-shares", response_model=List[ProfitShare])
async def get_profit_shares():
    docs = await db.profit_shares.find({}, {"_id": 0}).to_list(10000)
    return docs


@api_router.post("/profit-shares", response_model=ProfitShare)
async def create_profit_share(input: ProfitShareCreate):
    existing = await db.profit_shares.find_one({"bulan": input.bulan}, {"_id": 0})
    if existing:
        return existing
    obj = ProfitShare(**input.model_dump())
    await db.profit_shares.insert_one(obj.model_dump())
    return obj


@api_router.delete("/profit-shares/{bulan}")
async def delete_profit_share(bulan: str):
    await db.profit_shares.delete_one({"bulan": bulan})
    return {"ok": True}


# ---------------- Fixed Costs (Biaya Tetap) ----------------
@api_router.get("/fixed-costs", response_model=List[FixedCost])
async def get_fixed_costs():
    docs = await db.fixed_costs.find({}, {"_id": 0}).to_list(1000)
    if not docs:
        objs = [FixedCost(**c).model_dump() for c in DEFAULT_FIXED_COSTS]
        await db.fixed_costs.insert_many(objs)
        docs = objs
    return docs


@api_router.post("/fixed-costs", response_model=FixedCost)
async def create_fixed_cost(input: FixedCostCreate):
    obj = FixedCost(**input.model_dump())
    await db.fixed_costs.insert_one(obj.model_dump())
    return obj


@api_router.put("/fixed-costs/{fid}", response_model=FixedCost)
async def update_fixed_cost(fid: str, input: FixedCostCreate):
    existing = await db.fixed_costs.find_one({"id": fid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Biaya tidak ditemukan")
    updated = {**existing, **input.model_dump()}
    await db.fixed_costs.replace_one({"id": fid}, updated)
    return updated


@api_router.delete("/fixed-costs/{fid}")
async def delete_fixed_cost(fid: str):
    await db.fixed_costs.delete_one({"id": fid})
    return {"ok": True}


# ---------------- Products (Kalkulator HPP) ----------------
@api_router.get("/products", response_model=List[Product])
async def get_products():
    docs = await db.products.find({}, {"_id": 0}).to_list(2000)
    if not docs:
        objs = []
        i = 0
        for kategori, names in _PRODUCT_SEED.items():
            for nama in names:
                objs.append(Product(kategori=kategori, nama=nama, urutan=i).model_dump())
                i += 1
        await db.products.insert_many(objs)
        docs = objs
    docs.sort(key=lambda d: d.get("urutan", 0))
    return docs


@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    count = await db.products.count_documents({})
    obj = Product(**input.model_dump(), urutan=count)
    await db.products.insert_one(obj.model_dump())
    return obj


@api_router.put("/products/{pid}", response_model=Product)
async def update_product(pid: str, input: ProductCreate):
    existing = await db.products.find_one({"id": pid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    updated = {**existing, **input.model_dump()}
    await db.products.replace_one({"id": pid}, updated)
    return updated


@api_router.delete("/products/{pid}")
async def delete_product(pid: str):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# ---------------- Sales (Penjualan Produk + Nota) ----------------
@api_router.get("/sales", response_model=List[Sale])
async def get_sales():
    docs = await db.sales.find({}, {"_id": 0}).to_list(10000)
    return docs


@api_router.post("/sales", response_model=Sale)
async def create_sale(input: SaleCreate):
    tanggal = input.tanggal or datetime.now(WIB).strftime("%Y-%m-%d")
    qty = max(1, int(input.qty or 1))
    diskon = max(0, input.diskon or 0)
    subtotal = input.harga_satuan * qty
    total = max(0, subtotal - diskon)
    laba = (input.harga_satuan - input.hpp_satuan) * qty - diskon
    jenis = _SALE_JENIS.get(input.kategori, "Lain-lain")
    seq = await db.sales.count_documents({}) + 1
    nota_no = f"NT-{tanggal.replace('-', '')}-{seq:03d}"

    ket = f"{input.nama} x{qty}" if qty > 1 else input.nama
    txn = Transaction(
        tanggal=tanggal,
        keterangan=ket,
        kategori="Pemasukan",
        jenis=jenis,
        nominal=total,
        keterangan_tambahan=f"Nota {nota_no}" + (f" - {input.pembeli}" if input.pembeli else ""),
        auto_generated=True,
    )
    await db.transactions.insert_one(txn.model_dump())

    sale = Sale(
        nota_no=nota_no, tanggal=tanggal, nama=input.nama, kategori=input.kategori,
        jenis=jenis, pembeli=input.pembeli or "", qty=qty, harga_satuan=input.harga_satuan,
        hpp_satuan=input.hpp_satuan, diskon=diskon, total=total, laba=laba, product_id=input.product_id,
        transaction_id=txn.id,
    )
    await db.sales.insert_one(sale.model_dump())
    return sale


@api_router.delete("/sales/{sid}")
async def delete_sale(sid: str):
    sale = await db.sales.find_one({"id": sid}, {"_id": 0})
    if sale and sale.get("transaction_id"):
        await db.transactions.delete_one({"id": sale["transaction_id"]})
    await db.sales.delete_one({"id": sid})
    return {"ok": True}


# ---------------- Settings ----------------
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    doc = await db.settings.find_one({"key": "main"}, {"_id": 0})
    if not doc:
        return Settings()
    return Settings(saldo_awal=doc.get("saldo_awal", 0))


@api_router.put("/settings", response_model=Settings)
async def update_settings(input: Settings):
    await db.settings.update_one(
        {"key": "main"},
        {"$set": {"key": "main", "saldo_awal": input.saldo_awal}},
        upsert=True,
    )
    return input


# ---------------- Backup & Restore ----------------
@api_router.get("/backup", response_model=BackupData)
async def backup():
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    records = await db.records.find({}, {"_id": 0}).to_list(10000)
    profit_shares = await db.profit_shares.find({}, {"_id": 0}).to_list(10000)
    fixed_costs = await db.fixed_costs.find({}, {"_id": 0}).to_list(1000)
    products = await db.products.find({}, {"_id": 0}).to_list(2000)
    sales = await db.sales.find({}, {"_id": 0}).to_list(10000)
    settings = await db.settings.find_one({"key": "main"}, {"_id": 0}) or {}
    return BackupData(
        transactions=transactions,
        records=records,
        profit_shares=profit_shares,
        fixed_costs=fixed_costs,
        products=products,
        sales=sales,
        settings=settings,
    )


@api_router.post("/restore")
async def restore(data: BackupData):
    await db.transactions.delete_many({})
    await db.records.delete_many({})
    await db.profit_shares.delete_many({})
    await db.fixed_costs.delete_many({})
    await db.products.delete_many({})
    await db.sales.delete_many({})
    await db.settings.delete_many({})
    if data.transactions:
        await db.transactions.insert_many(data.transactions)
    if data.records:
        await db.records.insert_many(data.records)
    if data.profit_shares:
        await db.profit_shares.insert_many(data.profit_shares)
    if data.fixed_costs:
        await db.fixed_costs.insert_many(data.fixed_costs)
    if data.products:
        await db.products.insert_many(data.products)
    if data.sales:
        await db.sales.insert_many(data.sales)
    if data.settings:
        s = data.settings
        s["key"] = "main"
        await db.settings.insert_one(s)
    return {"ok": True}


@api_router.post("/import-transactions")
async def import_transactions(items: List[TransactionCreate]):
    objs = [Transaction(**i.model_dump()).model_dump() for i in items]
    if objs:
        await db.transactions.insert_many(objs)
    return {"ok": True, "count": len(objs)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
