"""Backend tests for Bukuku Pro sales stock decrement/restore flow."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://usaha-ledger-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture
def test_product(s):
    """Create a fresh test product and cleanup at end."""
    payload = {
        "kategori": "Branding",
        "nama": "TEST_ProdukStok",
        "jenis": "Sendiri",
        "bahan_baku": 10000,
        "jasa_mitra": 0,
        "tambahan": 0,
        "harga_jual": 50000,
        "stok": 10,
    }
    r = s.post(f"{API}/products", json=payload)
    assert r.status_code == 200, r.text
    p = r.json()
    yield p
    # cleanup
    s.delete(f"{API}/products/{p['id']}")


def _get_product(s, pid):
    r = s.get(f"{API}/products")
    assert r.status_code == 200
    for p in r.json():
        if p["id"] == pid:
            return p
    return None


class TestSalesStockFlow:
    def test_create_sale_decrements_stock(self, s, test_product):
        pid = test_product["id"]
        assert test_product["stok"] == 10
        sale_payload = {
            "product_id": pid,
            "nama": test_product["nama"],
            "kategori": "Branding",
            "qty": 3,
            "harga_satuan": 50000,
            "hpp_satuan": 10000,
            "diskon": 0,
            "pembeli": "TEST_Buyer",
        }
        r = s.post(f"{API}/sales", json=sale_payload)
        assert r.status_code == 200, r.text
        sale = r.json()
        assert sale["qty"] == 3
        assert sale["total"] == 150000
        assert sale["product_id"] == pid
        assert sale["transaction_id"]

        # verify stock decremented
        p = _get_product(s, pid)
        assert p["stok"] == 7, f"Expected stok=7, got {p['stok']}"

        # verify transaction created
        txn_id = sale["transaction_id"]
        txns = s.get(f"{API}/transactions").json()
        txn = next((t for t in txns if t["id"] == txn_id), None)
        assert txn is not None
        assert txn["kategori"] == "Pemasukan"
        assert txn["nominal"] == 150000

        # cleanup sale
        s.delete(f"{API}/sales/{sale['id']}")

    def test_delete_sale_restores_stock(self, s, test_product):
        pid = test_product["id"]
        sale_payload = {
            "product_id": pid, "nama": test_product["nama"], "kategori": "Branding",
            "qty": 4, "harga_satuan": 50000, "hpp_satuan": 10000, "diskon": 0,
        }
        r = s.post(f"{API}/sales", json=sale_payload)
        sale = r.json()
        assert _get_product(s, pid)["stok"] == 6

        # delete
        d = s.delete(f"{API}/sales/{sale['id']}")
        assert d.status_code == 200

        # stock restored
        assert _get_product(s, pid)["stok"] == 10

        # transaction removed
        txns = s.get(f"{API}/transactions").json()
        assert not any(t["id"] == sale["transaction_id"] for t in txns)

    def test_multiple_sales_cumulative_decrement(self, s, test_product):
        pid = test_product["id"]
        created_sales = []
        for qty in [2, 3, 1]:
            r = s.post(f"{API}/sales", json={
                "product_id": pid, "nama": test_product["nama"], "kategori": "Branding",
                "qty": qty, "harga_satuan": 50000, "hpp_satuan": 10000,
            })
            assert r.status_code == 200
            created_sales.append(r.json())
        assert _get_product(s, pid)["stok"] == 4
        for sale in created_sales:
            s.delete(f"{API}/sales/{sale['id']}")
        assert _get_product(s, pid)["stok"] == 10
