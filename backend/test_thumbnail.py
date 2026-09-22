import requests, pymongo
from datetime import datetime, timedelta

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['madatama']

# Insert a valid OTP manually
pin = '8888'
db.otp_requests.insert_one({
    'kontak': '08123456789',
    'pin': pin,
    'used': False,
    'expires_at': (datetime.utcnow() + timedelta(minutes=5)).isoformat()
})

# Get a real product
prod = db.products.find_one()
print('Product:', prod['nama'] if prod else 'None')

# Submit public order WITH custom_image
payload = {
    'nama': 'TestDesain Thumbnail',
    'kontak': '08123456789',
    'otp_pin': pin,
    'items': [{
        'product_id': prod['id'] if prod else 'DUMMY',
        'qty': 2,
        'catatan': 'Warna merah, ukuran L',
        'custom_image': 'https://picsum.photos/seed/madatama/200/300'
    }]
}
r = requests.post('http://localhost:8000/api/public/orders', json=payload)
print('Public Order:', r.json())
order_id = r.json().get('order_id')
if not order_id:
    print('Gagal buat order:', r.text)
    exit(1)

# Simulate Admin ACC: create Sale WITH custom_image (using updated endpoint)
sale_payload = {
    'nama': prod['nama'] if prod else 'Produk Test',
    'kategori': prod.get('kategori', 'Bebas') if prod else 'Bebas',
    'qty': 2,
    'harga_satuan': float(prod.get('harga_jual', 50000)) if prod else 50000,
    'hpp_satuan': float(prod.get('bahan_baku', 20000)) if prod else 20000,
    'is_dp': True,
    'dp_amount': 0,
    'pembeli': 'TestDesain Thumbnail',
    'product_id': prod['id'] if prod else 'DUMMY',
    'status_produksi': 'Desain',
    'public_order_id': order_id,
    'custom_image': 'https://picsum.photos/seed/madatama/200/300'
}
r2 = requests.post('http://localhost:8000/api/sales', json=sale_payload)
print('Sale Result:', r2.json())

# Verify what's stored
sale_id = r2.json().get('id')
if sale_id:
    stored = db.sales.find_one({'id': sale_id}, {'_id': 0, 'nama': 1, 'custom_image': 1, 'pembeli': 1})
    print('Stored in DB:', stored)
else:
    print('Sale ID not found, checking latest sale...')
    latest = db.sales.find_one({}, {'_id': 0, 'nama': 1, 'custom_image': 1, 'pembeli': 1}, sort=[('_id', -1)])
    print('Latest Sale:', latest)
