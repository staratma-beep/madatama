import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['madatama']

# Fix pesanan yang sudah di-Acc tapi tidak punya payment_status
result = db.public_orders.update_many(
    {
        "status": {"$ne": "Menunggu Konfirmasi"},
        "$or": [
            {"payment_status": {"$exists": False}},
            {"payment_status": None},
            {"payment_status": ""},
        ]
    },
    {"$set": {"payment_status": "Menunggu Pembayaran"}}
)
print(f"Fixed {result.modified_count} orders tanpa payment_status")

# Cek 10 pesanan terakhir
orders = list(db.public_orders.find({}, {"_id": 0, "id": 1, "nama": 1, "status": 1, "payment_status": 1}).sort("_id", -1).limit(10))
print("\n=== 10 Pesanan Terakhir ===")
for o in orders:
    print(f"  [{o['id']}] {o['nama']} | status={o.get('status')} | payment={o.get('payment_status')}")
