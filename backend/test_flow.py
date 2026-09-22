import requests
import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['bukuku']

print('Creating abstract order...')
requests.post('http://localhost:8000/api/public/request-otp', json={'kontak': '08123456789'})
pin = db.otp_requests.find_one({'kontak': '08123456789'}, sort=[('created_at', -1)])['pin']

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
order_id = res.json()['order_id']

# Create Sale
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
print('Sale created:', res_sale.json())

# Resolve public order
requests.post(f'http://localhost:8000/api/public-orders/{order_id}/accept')
print('Done!')
