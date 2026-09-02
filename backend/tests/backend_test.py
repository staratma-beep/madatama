"""Backend tests for Bukuku Pro (Indonesian bookkeeping)."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback to frontend/.env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module", autouse=True)
def snapshot_and_restore(client):
    """Snapshot before, restore after so we don't pollute the DB."""
    r = client.get(f"{API}/backup", timeout=30)
    assert r.status_code == 200, f"backup failed: {r.text}"
    original = r.json()
    yield
    # Restore
    client.post(f"{API}/restore", json=original, timeout=30)


@pytest.fixture(autouse=True)
def wipe_between_tests(client):
    """Wipe DB before each test for isolation."""
    client.post(f"{API}/restore", json={
        "transactions": [], "records": [], "profit_shares": [], "settings": {}
    }, timeout=30)
    yield


# ---------------- Settings ----------------
class TestSettings:
    def test_get_default(self, client):
        r = client.get(f"{API}/settings")
        assert r.status_code == 200
        assert r.json()["saldo_awal"] == 0

    def test_put_and_get(self, client):
        r = client.put(f"{API}/settings", json={"saldo_awal": 5000000})
        assert r.status_code == 200
        assert r.json()["saldo_awal"] == 5000000
        r2 = client.get(f"{API}/settings")
        assert r2.json()["saldo_awal"] == 5000000


# ---------------- Transactions ----------------
class TestTransactions:
    def test_crud_flow(self, client):
        payload = {
            "tanggal": "2026-01-05",
            "keterangan": "TEST Cetak Banner",
            "kategori": "Pemasukan",
            "jenis": "Penjualan",
            "nominal": 1500000,
            "keterangan_tambahan": "test",
        }
        r = client.post(f"{API}/transactions", json=payload)
        assert r.status_code == 200
        created = r.json()
        assert created["keterangan"] == "TEST Cetak Banner"
        assert created["nominal"] == 1500000
        assert "id" in created
        tid = created["id"]

        # List
        r = client.get(f"{API}/transactions")
        assert r.status_code == 200
        assert any(t["id"] == tid for t in r.json())

        # Update
        upd = {**payload, "nominal": 2000000, "keterangan": "TEST Updated"}
        r = client.put(f"{API}/transactions/{tid}", json=upd)
        assert r.status_code == 200
        assert r.json()["nominal"] == 2000000
        assert r.json()["keterangan"] == "TEST Updated"

        # Verify persistence
        r = client.get(f"{API}/transactions")
        found = [t for t in r.json() if t["id"] == tid][0]
        assert found["nominal"] == 2000000

        # Delete
        r = client.delete(f"{API}/transactions/{tid}")
        assert r.status_code == 200
        r = client.get(f"{API}/transactions")
        assert not any(t["id"] == tid for t in r.json())

    def test_update_nonexistent(self, client):
        r = client.put(f"{API}/transactions/does-not-exist", json={
            "tanggal": "2026-01-01", "keterangan": "x", "kategori": "Pemasukan",
            "jenis": "y", "nominal": 1,
        })
        assert r.status_code == 404


# ---------------- Records (Piutang/Utang) ----------------
class TestRecords:
    def test_create_settle_piutang_creates_income_txn(self, client):
        r = client.post(f"{API}/records", json={
            "tanggal": "2026-01-10", "jenis": "Piutang", "nama": "TEST Client A",
            "keterangan": "DP proyek", "nominal": 3000000,
        })
        assert r.status_code == 200
        rec = r.json()
        assert rec["status"] == "Belum Lunas"
        rid = rec["id"]

        # Settle
        r = client.post(f"{API}/records/{rid}/settle")
        assert r.status_code == 200
        settled = r.json()
        assert settled["status"] == "Lunas"
        assert settled["transaction_id"]

        # Auto txn should be Pemasukan
        r = client.get(f"{API}/transactions")
        auto = [t for t in r.json() if t["id"] == settled["transaction_id"]][0]
        assert auto["kategori"] == "Pemasukan"
        assert auto["nominal"] == 3000000
        assert auto["auto_generated"] is True
        assert auto["source_record_id"] == rid

    def test_settle_utang_creates_expense_txn(self, client):
        r = client.post(f"{API}/records", json={
            "tanggal": "2026-01-10", "jenis": "Utang", "nama": "TEST Vendor",
            "keterangan": "", "nominal": 500000,
        })
        rid = r.json()["id"]
        r = client.post(f"{API}/records/{rid}/settle")
        settled = r.json()
        r = client.get(f"{API}/transactions")
        auto = [t for t in r.json() if t["id"] == settled["transaction_id"]][0]
        assert auto["kategori"] == "Pengeluaran"
        assert auto["nominal"] == 500000

    def test_unsettle_deletes_auto_txn(self, client):
        r = client.post(f"{API}/records", json={
            "tanggal": "2026-01-10", "jenis": "Piutang", "nama": "TEST X",
            "nominal": 100000,
        })
        rid = r.json()["id"]
        r = client.post(f"{API}/records/{rid}/settle")
        txn_id = r.json()["transaction_id"]

        r = client.post(f"{API}/records/{rid}/unsettle")
        assert r.status_code == 200
        assert r.json()["status"] == "Belum Lunas"
        assert r.json()["transaction_id"] is None

        r = client.get(f"{API}/transactions")
        assert not any(t["id"] == txn_id for t in r.json())

    def test_delete_record_deletes_linked_txn(self, client):
        r = client.post(f"{API}/records", json={
            "tanggal": "2026-01-10", "jenis": "Piutang", "nama": "TEST Y",
            "nominal": 200000,
        })
        rid = r.json()["id"]
        r = client.post(f"{API}/records/{rid}/settle")
        txn_id = r.json()["transaction_id"]

        r = client.delete(f"{API}/records/{rid}")
        assert r.status_code == 200
        r = client.get(f"{API}/transactions")
        assert not any(t["id"] == txn_id for t in r.json())
        r = client.get(f"{API}/records")
        assert not any(x["id"] == rid for x in r.json())


# ---------------- Profit Shares ----------------
class TestProfitShares:
    def test_idempotent_per_bulan(self, client):
        payload = {"bulan": "2026-01", "laba_bersih": 10000000,
                   "bagian_pemilik": 5000000, "bagian_pengelola": 5000000}
        r1 = client.post(f"{API}/profit-shares", json=payload)
        assert r1.status_code == 200
        first_id = r1.json()["id"]

        # Second call with same bulan should return same record (idempotent)
        r2 = client.post(f"{API}/profit-shares", json={**payload, "laba_bersih": 999})
        assert r2.status_code == 200
        assert r2.json()["id"] == first_id
        assert r2.json()["laba_bersih"] == 10000000  # not overwritten

        r = client.get(f"{API}/profit-shares")
        assert len([p for p in r.json() if p["bulan"] == "2026-01"]) == 1

    def test_delete_by_bulan(self, client):
        client.post(f"{API}/profit-shares", json={"bulan": "2026-02", "laba_bersih": 1})
        r = client.delete(f"{API}/profit-shares/2026-02")
        assert r.status_code == 200
        r = client.get(f"{API}/profit-shares")
        assert not any(p["bulan"] == "2026-02" for p in r.json())


# ---------------- Backup / Restore / Import ----------------
class TestBackupRestore:
    def test_backup_shape(self, client):
        r = client.get(f"{API}/backup")
        assert r.status_code == 200
        d = r.json()
        for k in ["transactions", "records", "profit_shares", "settings"]:
            assert k in d

    def test_import_transactions_bulk(self, client):
        items = [
            {"tanggal": "2026-01-01", "keterangan": "TEST bulk1", "kategori": "Pemasukan",
             "jenis": "Penjualan", "nominal": 100000},
            {"tanggal": "2026-01-02", "keterangan": "TEST bulk2", "kategori": "Pengeluaran",
             "jenis": "Bahan", "nominal": 50000},
        ]
        r = client.post(f"{API}/import-transactions", json=items)
        assert r.status_code == 200
        assert r.json()["count"] == 2
        r = client.get(f"{API}/transactions")
        names = [t["keterangan"] for t in r.json()]
        assert "TEST bulk1" in names and "TEST bulk2" in names

    def test_restore_replaces_all(self, client):
        # Seed
        client.post(f"{API}/transactions", json={
            "tanggal": "2026-01-01", "keterangan": "will be wiped",
            "kategori": "Pemasukan", "jenis": "x", "nominal": 1})
        # Restore empty
        r = client.post(f"{API}/restore", json={
            "transactions": [], "records": [], "profit_shares": [],
            "settings": {"saldo_awal": 12345}})
        assert r.status_code == 200
        r = client.get(f"{API}/transactions")
        assert r.json() == []
        r = client.get(f"{API}/settings")
        assert r.json()["saldo_awal"] == 12345
