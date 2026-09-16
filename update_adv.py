import pymongo
client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['madatama_db']

images = {
    'neon': 'https://plus.unsplash.com/premium_photo-1707248107936-cbac5298a092?q=80&w=600&auto=format&fit=crop',
    'huruf': 'https://images.unsplash.com/photo-1549467650-6e4763fc0e78?q=80&w=600&auto=format&fit=crop',
    'plang': 'https://images.unsplash.com/photo-1606859341772-e08d662130e6?q=80&w=600&auto=format&fit=crop',
    'running': 'https://images.unsplash.com/photo-1518063546522-fbab8e100806?q=80&w=600&auto=format&fit=crop',
    'stiker': 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop',
    'acrylic': 'https://images.unsplash.com/photo-1589148769351-4043f44dc467?q=80&w=600&auto=format&fit=crop'
}

for p in db.products.find({'kategori': 'Advertising'}):
    nama = p['nama'].lower()
    img = 'https://images.unsplash.com/photo-1518063546522-fbab8e100806?q=80&w=600&auto=format&fit=crop'
    for k, v in images.items():
        if k in nama:
            img = v
            break
    # hardcoded string without variable reference
    db.products.update_one({'_id': p['_id']}, {'\x24set': {'image_url': img}})
print('Done update API')
