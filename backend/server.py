from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
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

# Create uploads directory if not exists
os.makedirs(os.path.join(ROOT_DIR, "uploads"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=os.path.join(ROOT_DIR, "uploads")), name="uploads")

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
    nama_usaha: str = "Bukuku Pro"
    alamat: str = ""
    telepon: str = ""
    logo: str = ""
    app_theme: str = "indigo"
    sidebar_config: Optional[list] = None
    tab_names: Optional[dict] = None


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
    stok: int = 0
    urutan: int = 0
    is_public: bool = False
    image_url: Optional[str] = ""
    deskripsi: Optional[str] = ""


class ProductCreate(BaseModel):
    kategori: str
    nama: str
    jenis: str = "Sendiri"
    bahan_baku: float = 0
    jasa_mitra: float = 0
    tambahan: float = 0
    harga_jual: float = 0
    stok: int = 0
    is_public: bool = False
    image_url: Optional[str] = ""
    deskripsi: Optional[str] = ""


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
    is_dp: bool = False
    dp_amount: float = 0
    piutang_record_id: Optional[str] = None
    status_produksi: str = "Selesai"  # "Desain", "Cetak", "Finishing", "Selesai", "Diambil"
    public_order_id: Optional[str] = None
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
    is_dp: bool = False
    dp_amount: float = 0
    status_produksi: Optional[str] = None
    public_order_id: Optional[str] = None

class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)
    action: str
    description: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    name: str
    role: str

class BackupData(BaseModel):
    transactions: List[dict] = []
    records: List[dict] = []
    profit_shares: List[dict] = []
    fixed_costs: List[dict] = []
    products: List[dict] = []
    sales: List[dict] = []
    settings: dict = {}


async def add_log(action: str, description: str):
    log = ActivityLog(action=action, description=description)
    await db.logs.insert_one(log.model_dump())

@api_router.get("/logs", response_model=List[ActivityLog])
async def get_logs():
    return await db.logs.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)

import bcrypt

@api_router.post("/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"username": req.username})
    if not user:
        raise HTTPException(status_code=401, detail="Username tidak ditemukan")
    
    if not bcrypt.checkpw(req.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Password salah")
        
    return {
        "ok": True,
        "token": user["username"],  # simple token
        "user": {
            "username": user["username"],
            "name": user.get("name", user["username"]),
            "role": user.get("role", "Kasir")
        }
    }

# ---------------- Transactions ----------------
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    docs = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    return docs

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    obj = Transaction(**input.model_dump())
    await db.transactions.insert_one(obj.model_dump())
    await add_log("Kas", f"Menambah transaksi {input.kategori}: {input.keterangan} ({input.nominal})")
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
    txn = await db.transactions.find_one({"id": tid})
    if txn:
        await add_log("Kas", f"Menghapus transaksi: {txn['keterangan']}")
        
        # Cascade 1: If this transaction was a Payment of a Piutang/Utang record
        source_rid = txn.get("source_record_id")
        if source_rid:
            rec = await db.records.find_one({"id": source_rid})
            if rec:
                rec["status"] = "Belum Lunas"
                rec["transaction_id"] = None
                await db.records.replace_one({"id": source_rid}, rec)
                
                # if tied to a sale DP
                sale = await db.sales.find_one({"piutang_record_id": source_rid})
                if sale:
                    await db.sales.update_one({"id": sale["id"]}, {"$set": {"is_dp": True, "piutang_lunas": False}})

        # Cascade 2: If this transaction was the main payment/DP of a Sale
        sale = await db.sales.find_one({"transaction_id": tid})
        if sale:
            # We completely delete the sale since its core payment was revoked
            await delete_sale(sale["id"], skip_txn=True)
            
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
    
    # Check if this record is tied to a Sale DP
    sale = await db.sales.find_one({"piutang_record_id": rid}, {"_id": 0})
    if sale:
        await db.sales.update_one({"id": sale["id"]}, {"$set": {"is_dp": False, "piutang_lunas": True}})
        po_id = sale.get("public_order_id")
        if po_id:
            await db.public_orders.update_one({"id": po_id}, {"$set": {"payment_status": "Lunas"}})
        
    await add_log("Pelunasan", f"Berhasil melunasi {rec['jenis']} dari {rec['nama']} lunas sejumlah {rec['nominal']}")
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
    
    sale = await db.sales.find_one({"piutang_record_id": rid}, {"_id": 0})
    if sale:
        await db.sales.update_one({"id": sale["id"]}, {"$set": {"is_dp": True, "piutang_lunas": False}})
        po_id = sale.get("public_order_id")
        if po_id:
            await db.public_orders.update_one({"id": po_id}, {"$set": {"payment_status": "Menunggu Pembayaran"}})
        
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
    dp_val = float(input.dp_amount) if input.is_dp else total
    
    txn = None
    piutang_record = None

    if dp_val > 0:
        txn = Transaction(
            tanggal=tanggal,
            keterangan=ket + (" (DP)" if input.is_dp else ""),
            kategori="Pemasukan",
            jenis=jenis,
            nominal=dp_val,
            keterangan_tambahan=f"Nota {nota_no}" + (f" - {input.pembeli}" if input.pembeli else ""),
            auto_generated=True,
        )
        await db.transactions.insert_one(txn.model_dump())
        
    if input.is_dp and total > dp_val:
        piutang_record = Record(
            tanggal=tanggal,
            jenis="Piutang",
            nama=input.pembeli or "Hamba Allah",
            keterangan=f"Sisa Tagihan Nota {nota_no} - {ket}",
            nominal=total - dp_val,
            status="Belum Lunas",
        )
        await db.records.insert_one(piutang_record.model_dump())

    status_prod = input.status_produksi or ("Desain" if input.is_dp else "Selesai")

    sale = Sale(
        nota_no=nota_no, tanggal=tanggal, nama=input.nama, kategori=input.kategori,
        jenis=jenis, pembeli=input.pembeli or "", qty=qty, harga_satuan=input.harga_satuan,
        hpp_satuan=input.hpp_satuan, diskon=diskon, total=total, laba=laba, product_id=input.product_id,
        transaction_id=txn.id if txn else None,
        is_dp=input.is_dp,
        dp_amount=dp_val,
        piutang_record_id=piutang_record.id if piutang_record else None,
        status_produksi=status_prod,
        public_order_id=input.public_order_id,
    )
    await db.sales.insert_one(sale.model_dump())
    if input.product_id:
        await db.products.update_one({"id": input.product_id}, {"$inc": {"stok": -qty}})
    
    await add_log("Penjualan", f"Mencatat pesanan {nota_no}: {input.nama} x{qty} dari {input.pembeli or 'Pelanggan'}")
    return sale


@api_router.delete("/sales/{sid}")
async def delete_sale_route(sid: str):
    return await delete_sale(sid)

async def delete_sale(sid: str, skip_txn: bool = False):
    sale = await db.sales.find_one({"id": sid}, {"_id": 0})
    if sale:
        if not skip_txn and sale.get("transaction_id"):
            await db.transactions.delete_one({"id": sale["transaction_id"]})
        if sale.get("piutang_record_id"):
            await db.records.delete_one({"id": sale["piutang_record_id"]})
        if sale.get("product_id"):
            await db.products.update_one({"id": sale["product_id"], "stok": {"$exists": True}}, {"$inc": {"stok": sale.get("qty", 0)}})
    await db.sales.delete_one({"id": sid})
    await add_log("Hapus Nota", f"Menghapus pesanan nota {sale.get('nota_no', sid) if sale else sid}")
    return {"ok": True}

@api_router.patch("/sales/{sid}/status")
async def update_sale_status(sid: str, payload: dict):
    new_status = payload.get("status_produksi")
    if not new_status:
        raise HTTPException(400, "status_produksi required")
        
    sale_before = await db.sales.find_one({"id": sid}, {"_id": 0})
    if not sale_before:
        raise HTTPException(404, "Sale not found")
        
    await db.sales.update_one({"id": sid}, {"$set": {"status_produksi": new_status}})
    
    sale = await db.sales.find_one({"id": sid}, {"_id": 0})
    if sale:
        await add_log("Produksi", f"Status pesanan {sale['nota_no']} diubah menjadi {new_status}")
        
        po_id = sale.get("public_order_id")
        if po_id:
            all_sales = await db.sales.find({"public_order_id": po_id}).to_list(100)
            if all_sales:
                all_selesai = True
                for s in all_sales:
                    if s.get("status_produksi") != "Selesai":
                        all_selesai = False
                        break
                po_status = "Selesai" if all_selesai else "Diterima (Sedang Diproses)"
                await db.public_orders.update_one({"id": po_id}, {"$set": {"status": po_status}})
                
    return {"ok": True, "status_produksi": new_status}

# ---------------- Settings ----------------
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    doc = await db.settings.find_one({"key": "main"}, {"_id": 0})
    if not doc:
        return Settings()
    doc.pop("key", None)
    return Settings(**doc)


@api_router.put("/settings", response_model=Settings)
async def update_settings(input: Settings):
    await db.settings.update_one(
        {"key": "main"},
        {"$set": {"key": "main", **input.model_dump()}},
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
    
class WebSettingsSchema(BaseModel):
    title: str = "Kualitas Terbaik, Harga Masuk Akal."
    subtitle: str = "Dari spanduk besar hingga stempel kecil, semua kebutuhan promosi dan bisnis Anda ada di sini."
    banner_url: str = ""
    theme_gradient: str = "indigo-purple"
    banner_position: str = "center"
    banner_opacity: int = 40

@api_router.get("/web-settings", response_model=WebSettingsSchema)
async def get_web_settings():
    doc = await db.web_settings.find_one({"key": "main"}, {"_id": 0})
    if not doc:
        doc = WebSettingsSchema().model_dump()
        doc["key"] = "main"
        await db.web_settings.insert_one(doc)
    return doc

@api_router.put("/web-settings", response_model=WebSettingsSchema)
async def update_web_settings(input: WebSettingsSchema):
    doc = input.model_dump()
    doc["key"] = "main"
    await db.web_settings.replace_one({"key": "main"}, doc, upsert=True)
    return doc


@api_router.post("/import-transactions")
async def import_transactions(items: List[TransactionCreate]):
    objs = [Transaction(**i.model_dump()).model_dump() for i in items]
    if objs:
        await db.transactions.insert_many(objs)
    return {"ok": True, "count": len(objs)}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    import shutil
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex[:8]}.{ext}"
    path = os.path.join(ROOT_DIR, "uploads", filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"http://localhost:8000/uploads/{filename}"}


# ---------------- Public API (Storefront) ----------------
class PublicOrderItem(BaseModel):
    product_id: str
    qty: int = 1
    catatan: Optional[str] = ""

class PublicOrderCreate(BaseModel):
    nama: str
    kontak: str
    items: List[PublicOrderItem]

@api_router.get("/public/settings")
async def public_get_settings():
    doc = await db.web_settings.find_one({"key": "main"}, {"_id": 0})
    if not doc:
        return WebSettingsSchema().model_dump()
    return doc

@api_router.get("/public/products")
async def public_get_products():
    prods = await db.products.find({"is_public": True}, {"_id": 0}).to_list(100)
    return prods

@api_router.post("/public/orders")
async def public_create_order(req: PublicOrderCreate):
    order_id = "ORD-" + str(uuid.uuid4())[:8].upper()
    doc = {
        "id": order_id,
        "nama": req.nama,
        "kontak": req.kontak,
        "items": [i.model_dump() for i in req.items],
        "status": "Menunggu Konfirmasi",
        "created_at": now_iso()
    }
    await db.public_orders.insert_one(doc)
    return {"ok": True, "order_id": order_id}

class PaymentSubmit(BaseModel):
    payment_method: str
    bukti_bayar: str

@api_router.post("/public/orders/{order_id}/pay")
async def public_pay_order(order_id: str, payload: PaymentSubmit):
    po = await db.public_orders.find_one({"id": order_id})
    if not po:
        raise HTTPException(404, "Pesanan tidak ditemukan")
    await db.public_orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_method": payload.payment_method,
            "bukti_bayar": payload.bukti_bayar,
            "payment_status": "Menunggu Konfirmasi Bayar"
        }}
    )
    return {"ok": True}

@api_router.get("/public/track/{order_id}")
async def public_track_order(order_id: str):
    # Could be tracking from public_orders or from sales (nota)
    po = await db.public_orders.find_one({"id": order_id}, {"_id": 0})
    if po:
        sales = await db.sales.find({"public_order_id": order_id}, {"_id": 0}).to_list(100)
        items = []
        overall_status = po.get("status")
        total_tagihan = 0
        if sales:
            if overall_status == "Menunggu Konfirmasi": 
                # If they have sales but status is still awaiting, although logic in front sets it to Diterima, let's just make it SEDANG DIPROSES if not finished
                overall_status = "Menunggu Pembayaran" if not po.get('bukti_bayar') else "SEDANG DIPROSES"
            elif overall_status == "Diterima (Sedang Diproses)":
                overall_status = "Menunggu Pembayaran" if not po.get('bukti_bayar') else "SEDANG DIPROSES"
                
            all_done = True
            for s in sales:
                total_tagihan += s.get("total", 0)
                items.append({
                    "nama": s["nama"],
                    "qty": s["qty"],
                    "status": s.get("status_produksi", "Menunggu")
                })
                if s.get("status_produksi") != "Selesai":
                    all_done = False
                    
            if all_done:
                overall_status = "SELESAI"
                
        return {
            "id": po["id"], 
            "type": "pesanan", 
            "status": overall_status,
            "items": items,
            "total_tagihan": total_tagihan,
            "payment_method": po.get("payment_method"),
            "bukti_bayar": po.get("bukti_bayar"),
            "payment_status": po.get("payment_status", "Belum Bayar")
        }
    
    # If not in public orders, check sales (nota) if they use nota as tracking ID
    sale = await db.sales.find_one({"nota_no": order_id}, {"_id": 0})
    if sale:
        return {"id": sale["nota_no"], "type": "produksi", "status": sale.get("status_produksi")}
    
    raise HTTPException(404, "Pesanan tidak ditemukan")

# Admin endpoints for public orders
@api_router.get("/public-orders")
async def get_admin_public_orders():
    # Return all orders, sorting newest first
    orders = await db.public_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)
    for o in orders:
        for item in o.get("items", []):
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            item["product"] = product
        
        # Legacy fallback for old test requests
        if "product_id" in o and "product" not in o:
            product = await db.products.find_one({"id": o["product_id"]}, {"_id": 0})
            o["product"] = product
    return orders

@api_router.post("/public-orders/{order_id}/accept")
async def resolve_public_order(order_id: str):
    await db.public_orders.update_one({"id": order_id}, {"$set": {"status": "Diterima (Sedang Diproses)"}})
    return {"ok": True}

@api_router.delete("/public-orders/{order_id}/hard")
async def delete_public_order(order_id: str):
    # cascade delete associated sales
    sales = await db.sales.find({"public_order_id": order_id}).to_list(100)
    for s in sales:
        await delete_sale(s["id"])
        
    # hard delete the public order
    await db.public_orders.delete_one({"id": order_id})
    return {"ok": True}

@api_router.put("/public-orders/{order_id}")
async def edit_public_order(order_id: str, payload: dict):
    # payload can contain fields to update
    await db.public_orders.update_one({"id": order_id}, {"$set": payload})
    return {"ok": True}

@api_router.post("/public-orders/{order_id}/confirm-payment")
async def confirm_public_order_payment(order_id: str):
    po = await db.public_orders.find_one({"id": order_id})
    if not po:
        return {"ok": False, "msg": "Not found"}

    payment_method = po.get("payment_method", "")
    method_str = f" (Via {payment_method})" if payment_method else ""

    await db.public_orders.update_one({"id": order_id}, {"$set": {"payment_status": "Lunas"}})
    # Mark all related piutang records as lunas
    sales = await db.sales.find({"public_order_id": order_id}).to_list(100)
    for sale in sales:
        rid = sale.get("piutang_record_id")
        if rid:
            rec = await db.records.find_one({"id": rid})
            if rec and rec["status"] == "Belum Lunas":
                sale_jenis = sale.get("jenis", "Lain-lain")
                txn = Transaction(
                    tanggal=datetime.now(WIB).strftime("%Y-%m-%d"),
                    keterangan=f"Pelunasan Pesanan Web: {rec['nama']}{method_str}",
                    kategori="Pemasukan",
                    jenis=sale_jenis,
                    nominal=rec["nominal"],
                    keterangan_tambahan=rec.get("keterangan", ""),
                    auto_generated=True,
                    source_record_id=rid,
                )
                await db.transactions.insert_one(txn.model_dump())
                rec["status"] = "Lunas"
                rec["transaction_id"] = txn.id
                await db.records.replace_one({"id": rid}, rec)
                await db.sales.update_one({"id": sale["id"]}, {"$set": {"is_dp": False, "piutang_lunas": True}})
                await add_log("Pelunasan", f"Berhasil konfirmasi bayar online {rec['nama']} sejumlah {rec['nominal']}{method_str}")
    return {"ok": True}

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
