import pymongo
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['madatama']

print("=== CHECK PUBLIC ORDERS ===")
pos = list(db.public_orders.find().sort('_id', -1).limit(2))
for po in pos:
    items = po.get('items', [])
    for idx, it in enumerate(items):
        print(f"PO {po.get('id')} -> item {idx} custom_image:", it.get('custom_image'))

print("=== CHECK SALES ===")
sales = list(db.sales.find().sort('_id', -1).limit(2))
for s in sales:
    print(f"SALE {s.get('id')} -> custom_image:", s.get('custom_image'))
