from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Request, Response, Depends, status
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

client = None
db = None

mongo_url = os.environ.get("MONGO_URL")
if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    db = client["madatama"]

app = FastAPI()

# Create uploads directory if not exists
os.makedirs(os.path.join(ROOT_DIR, "uploads"), exist_ok=True)

# Replace StaticFiles mount with an explicit endpoint to ensure CORSMiddleware applies
from fastapi.responses import FileResponse

api_router = APIRouter()

@app.get("/uploads/{filename}")
async def get_upload_file(filename: str):
    from fastapi.responses import FileResponse
    from starlette.responses import Response
    path = os.path.join(ROOT_DIR, "uploads", filename)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    response = FileResponse(path)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    return response


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
    tagline_usaha: str = "Official System"
    alamat: str = ""
    telepon: str = ""
    logo: str = ""
    favicon: str = ""
    app_theme: str = "indigo"
    dark_mode: bool = False
    sidebar_config: Optional[list] = None
    tab_names: Optional[dict] = None
    role_permissions: Optional[dict] = None


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
    color_images: Optional[dict] = Field(default_factory=dict)


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
    color_images: Optional[dict] = Field(default_factory=dict)


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
    custom_image: Optional[str] = None
    tenggat_waktu: Optional[str] = None
    is_prioritas: bool = False
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
    custom_image: Optional[str] = None
    tenggat_waktu: Optional[str] = None

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

from auth_security import (
    verify_password, create_access_token, get_token_from_cookie, 
    SECRET_KEY, ALGORITHM, LoginAuditSchema
)
from jose import jwt, JWTError

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired or is invalid")
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return user

def require_role(roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Tindakan ditolak. Hak akses diperlukan: {', '.join(roles)}"
            )
        return current_user
    return role_checker

@api_router.post("/login")
async def login(req: LoginRequest, request: Request, response: Response):
    try:
        ip_address = str(request.client.host) if request.client and request.client.host else "unknown"
        
        user = await db.users.find_one({"username": req.username})
        
        # 1. User Tidak Ditemukan
        if not user:
            audit = LoginAuditSchema(username=req.username, ip_address=ip_address, status="FAILED")
            await db.audit_logs.insert_one(audit.model_dump())
            raise HTTPException(status_code=401, detail="Kredensial tidak valid")
        
        # 2. Check Lockout (Rate Limiting)
        if user.get("locked_until"):
            locked_until = datetime.fromisoformat(user["locked_until"])
            if datetime.now() < locked_until:
                audit = LoginAuditSchema(username=req.username, ip_address=ip_address, status="LOCKED")
                await db.audit_logs.insert_one(audit.model_dump())
                raise HTTPException(status_code=429, detail="Akun terkunci. Silakan coba 15 menit lagi.")
            else:
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"locked_until": None, "failed_login_attempts": 0}})
        
        # 3. Check Password
        is_valid = verify_password(req.password, user.get("password_hash", user.get("password", "")))
        if not is_valid:
            attempts = user.get("failed_login_attempts", 0) + 1
            update_data = {"failed_login_attempts": attempts}
            if attempts >= 5:
                update_data["locked_until"] = (datetime.now() + timedelta(minutes=15)).isoformat()
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            
            audit = LoginAuditSchema(username=req.username, ip_address=ip_address, status="FAILED")
            await db.audit_logs.insert_one(audit.model_dump())
            raise HTTPException(status_code=401, detail="Kredensial tidak valid")
            
        # 4. Berhasil Login
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"failed_login_attempts": 0, "locked_until": None}})
        
        audit = LoginAuditSchema(username=req.username, ip_address=ip_address, status="SUCCESS")
        await db.audit_logs.insert_one(audit.model_dump())
        await add_log("Login", f"User {user['username']} [{user['role']}] berhasil masuk.")
        
        # Generate Token
        access_token = create_access_token(data={"sub": user["username"], "role": user.get("role")})
        
        # Set Secure HttpOnly Cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            path="/",
            max_age=30 * 60, # 30 Menit
            expires=30 * 60,
            samesite="lax",
            secure=False,
        )
        
        return {
            "ok": True,
            "must_change_password": user.get("must_change_password", False),
            "user": {
                "username": user["username"],
                "name": user.get("name", user["username"]),
                "role": user.get("role", "Kasir")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        await db.logs.insert_one({"action": "Login Crash", "description": str(error_msg)})
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/user/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "ok": True,
        "user": {
            "username": current_user["username"],
            "name": current_user.get("name", current_user["username"]),
            "role": current_user.get("role", "Kasir")
        }
    }

@api_router.post("/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    await add_log("Logout", f"User {current_user['username']} keluar sesi.")
    return {"ok": True}

# ---------------- User Management (Owner Only) ----------------
class UserCreateRequest(BaseModel):
    username: str
    password: str
    name: str
    role: str  # "Owner", "Produksi", "Kasir"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordResetRequest(BaseModel):
    new_password: str

@api_router.get("/users")
async def list_users(current_user: dict = Depends(require_role(["Owner"]))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "password": 0}).to_list(100)
    return users

@api_router.post("/users")
async def create_user(req: UserCreateRequest, current_user: dict = Depends(require_role(["Owner"]))):
    existing = await db.users.find_one({"username": req.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")
    from auth_security import get_password_hash
    new_user = {
        "id": str(uuid.uuid4()),
        "username": req.username,
        "password_hash": get_password_hash(req.password),
        "name": req.name,
        "role": req.role,
        "is_active": True,
        "must_change_password": True,
        "created_at": datetime.now().isoformat(),
        "failed_login_attempts": 0,
        "locked_until": None
    }
    await db.users.insert_one(new_user)
    await add_log("User", f"Owner membuat akun baru: {req.username} [{req.role}]")
    return {"ok": True, "username": req.username}

@api_router.put("/users/{username}")
async def update_user(username: str, req: UserUpdateRequest, current_user: dict = Depends(require_role(["Owner"]))):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    update_data = {}
    if req.name is not None: update_data["name"] = req.name
    if req.role is not None: update_data["role"] = req.role
    if req.is_active is not None: update_data["is_active"] = req.is_active
    if req.username is not None and req.username != username:
        exist = await db.users.find_one({"username": req.username})
        if exist:
            raise HTTPException(status_code=400, detail="Username sudah digunakan")
        update_data["username"] = req.username
    if update_data:
        await db.users.update_one({"username": username}, {"$set": update_data})
    await add_log("User", f"Owner mengubah akun: {username}")
    return {"ok": True}

@api_router.post("/users/{username}/reset-password")
async def reset_password(username: str, req: PasswordResetRequest, current_user: dict = Depends(require_role(["Owner"]))):
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")
    from auth_security import get_password_hash
    await db.users.update_one(
        {"username": username},
        {"$set": {"password_hash": get_password_hash(req.new_password), "must_change_password": True, "failed_login_attempts": 0, "locked_until": None}}
    )
    await add_log("User", f"Owner mereset password akun: {username}")
    return {"ok": True}

@api_router.delete("/users/{username}")
async def delete_user(username: str, current_user: dict = Depends(require_role(["Owner"]))):
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")
    result = await db.users.delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    await add_log("User", f"Owner menghapus akun: {username}")
    return {"ok": True}

class FactoryResetRequest(BaseModel):
    password: str

@api_router.post("/factory-reset")
async def factory_reset(req: FactoryResetRequest, current_user: dict = Depends(require_role(["Owner"]))):
    from auth_security import verify_password
    
    # 1. Verify owner password
    user = await db.users.find_one({"username": current_user["username"]})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Password Owner tidak valid")
        
    # 2. Delete data from collections (leaving settings, fixed_costs, users alone)
    await db.transactions.delete_many({})
    await db.sales.delete_many({})
    await db.public_orders.delete_many({})
    await db.piutang.delete_many({})  # just in case
    await db.profit_share.delete_many({})
    await db.logs.delete_many({})
    
    # 3. Log the reset (this will be the only log left!)
    await add_log("Sistem", f"FACTORY RESET dijalankan oleh {current_user['username']} - Semua data transaksi dihapus.")
    
    return {"ok": True, "message": "Sistem berhasil di-reset bersih."}



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
@api_router.get("/products")
async def get_products():
    try:
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
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


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
        custom_image=input.custom_image or None,
        tenggat_waktu=input.tenggat_waktu or None,
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
                # Determine the overall status based on all production items
                statuses = [s.get("status_produksi", "Desain") for s in all_sales]
                
                # Priority order from most advanced to least
                STATUS_PRIORITY = ["Diambil", "Selesai", "Finishing", "Cetak", "Desain"]
                
                all_diambil = all(s == "Diambil" for s in statuses)
                all_selesai_or_diambil = all(s in ("Selesai", "Diambil") for s in statuses)
                any_selesai = any(s in ("Selesai", "Diambil") for s in statuses)
                
                if all_diambil:
                    po_status = "Diambil"
                elif all_selesai_or_diambil:
                    po_status = "Siap Diambil"
                elif any_selesai:
                    po_status = "Sedang Diproses"
                else:
                    # Find the most advanced status among all items
                    for prio in STATUS_PRIORITY:
                        if prio in statuses:
                            po_status = f"Sedang {prio}"
                            break
                    else:
                        po_status = "Diterima (Sedang Diproses)"
                
                await db.public_orders.update_one({"id": po_id}, {"$set": {"status": po_status}})
                
    return {"ok": True, "status_produksi": new_status}

@api_router.patch("/sales/{sid}/deadline")
async def update_sale_deadline(sid: str, payload: dict):
    deadline = payload.get("tenggat_waktu")
    sale = await db.sales.find_one({"id": sid}, {"_id": 0})
    if not sale:
        raise HTTPException(404, "Sale not found")
        
    await db.sales.update_one({"id": sid}, {"$set": {"tenggat_waktu": deadline}})
    await add_log("Produksi", f"Tenggat waktu pesanan {sale['nota_no']} diupdate menjadi {deadline or 'Kosong'}")

    return {"ok": True, "tenggat_waktu": deadline}

@api_router.patch("/sales/{sid}/prioritas")
async def toggle_sale_prioritas(sid: str, payload: dict):
    is_prioritas = bool(payload.get("is_prioritas", False))
    sale = await db.sales.find_one({"id": sid}, {"_id": 0})
    if not sale:
        raise HTTPException(404, "Sale not found")
    await db.sales.update_one({"id": sid}, {"$set": {"is_prioritas": is_prioritas}})
    label = "ditandai PRIORITAS" if is_prioritas else "prioritas dihapus"
    await add_log("Produksi", f"Pesanan {sale['nota_no']} {label}")
    return {"ok": True, "is_prioritas": is_prioritas}

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
    business_name: str = "Madatama Print"
    logo_url: str = ""
    favicon_url: str = ""
    whatsapp_number: str = ""
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
    custom_image: Optional[str] = ""

class PublicOrderCreate(BaseModel):
    nama: str
    kontak: str
    otp_pin: str
    items: List[PublicOrderItem]

class OTPRequest(BaseModel):
    kontak: str

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

@api_router.post("/public/request-otp")
async def public_request_otp(req: OTPRequest):
    import random
    from datetime import datetime, timedelta
    
    # Anti-spam: Cek apakah baru saja request dalam 1 menit yang lalu
    recent_otp = await db.otp_requests.find_one({
        "kontak": req.kontak,
        "created_at": {"$gte": (datetime.utcnow() - timedelta(seconds=60)).isoformat()}
    })
    
    if recent_otp:
        raise HTTPException(status_code=429, detail="Harap tunggu 1 menit sebelum meminta kode baru.")
    
    pin = str(random.randint(1000, 9999))
    expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    
    await db.otp_requests.insert_one({
        "kontak": req.kontak,
        "pin": pin,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": expires_at,
        "used": False
    })
    
    # [WA API GATEWAY MOCK]
    # Di sini tempat eksekusi HTTP Request ke vendor WhatsApp (Fonnte/Wablas dll)
    # Karena belum di set up, kita print ke logger (memaksa flush agar muncul di Windows)
    import sys
    print(f"\n" + "="*50, flush=True)
    print(f"✅ MENGIRIM KODE OTP WHATSAPP", flush=True)
    print(f"Ke Nomor : {req.kontak}", flush=True)
    print(f"Teks     : Halo! Kode rahasia Order Madatama Anda adalah: {pin}. Jangan berikan kode ini kepada siapapun.", flush=True)
    print("="*50 + "\n", flush=True)
    
    return {"ok": True, "message": "Kode OTP berhasil dikirim", "dev_pin": pin}

@api_router.post("/public/orders")
async def public_create_order(req: PublicOrderCreate):
    from datetime import datetime
    
    # Validasi OTP
    otp_doc = await db.otp_requests.find_one({
        "kontak": req.kontak,
        "pin": req.otp_pin,
        "used": False,
        "expires_at": {"$gte": datetime.utcnow().isoformat()}
    })
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Kode PIN tidak valid atau sudah kedaluwarsa.")
        
    # Tandai OTP sudah terpakai
    await db.otp_requests.update_one({"_id": otp_doc["_id"]}, {"$set": {"used": True}})

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
    po = await db.public_orders.find_one({"id": order_id}, {"_id": 0})
    if po:
        sales = await db.sales.find({"public_order_id": order_id}, {"_id": 0}).to_list(100)
        items = []
        total_tagihan = 0
        
        # Build items list with actual production status
        if sales:
            for s in sales:
                total_tagihan += s.get("total", 0)
                items.append({
                    "nama": s["nama"],
                    "qty": s["qty"],
                    "status": s.get("status_produksi", "Menunggu"),
                    "nota_no": s.get("nota_no", ""),
                })
        
        # Compute overall_status dynamically from production statuses
        if sales:
            statuses = [s.get("status_produksi", "Desain") for s in sales]
            all_diambil = all(s == "Diambil" for s in statuses)
            all_selesai_or_diambil = all(s in ("Selesai", "Diambil") for s in statuses)
            any_finishing_plus = any(s in ("Finishing", "Selesai", "Diambil") for s in statuses)
            any_cetak_plus = any(s in ("Cetak", "Finishing", "Selesai", "Diambil") for s in statuses)
            
            if all_diambil:
                overall_status = "Diambil"
            elif all_selesai_or_diambil:
                overall_status = "Siap Diambil"
            elif any_finishing_plus:
                overall_status = "Finishing"
            elif any_cetak_plus:
                overall_status = "Sedang Cetak"
            else:
                overall_status = "Sedang Desain"
            
            # Override: if public order payment not yet done
            po_payment_status = po.get("payment_status", "Belum Bayar")
            if po_payment_status not in ("Lunas",) and not po.get("bukti_bayar"):
                # No payment yet: flag as awaiting payment only if admin already accepted
                if po.get("status") not in ("Menunggu Konfirmasi",):
                    overall_status = "Menunggu Pembayaran"
        else:
            # No sales yet: order still being reviewed
            overall_status = po.get("status", "Menunggu Konfirmasi")
        
        # Populate product data for raw items display
        raw_items = po.get("items", [])
        for it in raw_items:
            if "product_id" in it:
                prod = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
                if prod:
                    it["product"] = prod

        return {
            "id": po["id"],
            "nama": po.get("nama"),
            "created_at": po.get("created_at"),
            "type": "pesanan",
            "status": overall_status,
            "items": raw_items,
            "sales_items": items,
            "total_tagihan": total_tagihan,
            "payment_method": po.get("payment_method"),
            "bukti_bayar": po.get("bukti_bayar"),
            "payment_status": po.get("payment_status", "Belum Bayar")
        }
    
    # If not in public orders, check sales (nota)
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
        total = 0
        for item in o.get("items", []):
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            item["product"] = product
            if product:
                total += (product.get("harga_jual") or 0) * item.get("qty", 1)
        
        # Legacy fallback for old test requests
        if "product_id" in o and "product" not in o:
            product = await db.products.find_one({"id": o["product_id"]}, {"_id": 0})
            o["product"] = product
            if product:
                total += (product.get("harga_jual") or 0) * o.get("qty", 1)
        
        o["total"] = total
    return orders

@api_router.post("/public-orders/{order_id}/accept")
async def resolve_public_order(order_id: str):
    await db.public_orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "Diterima (Sedang Diproses)",
            "payment_status": "Menunggu Pembayaran",
            "accepted_at": now_iso()
        }}
    )
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

# Middleware untuk memastikan gambar di /uploads/ bisa dibaca oleh canvas (html2canvas/crossOrigin)
from starlette.middleware.base import BaseHTTPMiddleware
class UploadsCORPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/uploads/"):
            response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
            response.headers["Access-Control-Allow-Origin"] = "*"
        return response

app.add_middleware(UploadsCORPMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
