import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client['madatama_db']

products = db.products.find({'kategori': 'Advertising'})

images = {
    'Neon Box': 'https://images.unsplash.com/photo-1563240619-44ec0047592c?q=80&w=600&auto=format&fit=crop',
    'Huruf Timbul': 'https://images.unsplash.com/photo-1549467650-6e4763fc0e78?q=80&w=600&auto=format&fit=crop',
    'Plang Nama': 'https://images.unsplash.com/photo-1606859341772-e08d662130e6?q=80&w=600&auto=format&fit=crop',
    'Running Text': 'https://images.unsplash.com/photo-1518063546522-fbab8e100806?q=80&w=600&auto=format&fit=crop',
    'Stiker Sandblast': 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop',
    'Acrylic Sign': 'https://images.unsplash.com/photo-1589148769351-4043f44dc467?q=80&w=600&auto=format&fit=crop'
}

count = 0
default_img = 'https://images.unsplash.com/photo-1518063546522-fbab8e100806?q=80&w=600&auto=format&fit=crop'

for p in products:
    matched = False
    for k, v in images.items():
        if k.lower() in p['nama'].lower():
            db.products.update_one({'_id': p['_id']}, {'$set: {'image_url': v}})
            matched = True
            count += 1
            break
    if not matched:
        db.products.update_one({'_id': p['_id']}, {'$set: {'image_url': default_img}})
        count += 1

print(f"Updated {count} products")
