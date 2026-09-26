import requests
import pymongo
from datetime import datetime, timedelta

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['bukuku']

pin = '1234'
db.otp_requests.insert_one({
    'kontak': '08123456789', 
    'pin': pin, 
    'used': False, 
    'expires_at': (datetime.utcnow() + timedelta(minutes=5)).isoformat()
})

prod = db.products.find_one()
payload = {
    'nama': 'Mister Thumbnail',
    'kontak': '08123456789',
    'otp_pin': pin,
    'items': [
        {
            'product_id': prod['id'] if prod else 'PRD-DEFAULT',
            'qty': 3,
            'catatan': 'Warna biru',
            'custom_image': 'https://picsum.photos/seed/picsum/200/300'
        }
    ]
}

res = requests.post('http://localhost:8000/api/public/orders', json=payload)
print('Order created:', res.json())
order_id = res.json().get('order_id')
if not order_id: exit(1)

sale_payload = {
    'nama': prod['nama'] if prod else 'Produk Dummy',
    'kategori': 'Bebas',
    'qty': 3,
    'harga_satuan': 50000,
    'hpp_satuan': 30000,
    'is_dp': True,
    'dp_amount': 0,
    'pembeli': 'Mister Thumbnail',
    'product_id': prod['id'] if prod else 'PRD-123',
    'status_produksi': 'Desain',
    'public_order_id': order_id,
    'custom_image': 'https://picsum.photos/seed/picsum/200/300'
}
res_sale = requests.post('http://localhost:8000/api/sales', json=sale_payload)
print('Sale:', res_sale.json())
requests.post(f'http://localhost:8000/api/public-orders/{order_id}/accept')
print('Ok')
