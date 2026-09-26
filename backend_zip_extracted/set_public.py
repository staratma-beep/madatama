import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

IMAGES = {
    'Branding': 'https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=500&q=80',
    'Printing': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80', 
    'Advertising': 'https://plus.unsplash.com/premium_photo-1681488107931-10cbf1eed4f8?w=500&q=80'
}

async def p():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.madatama # corrected db name
    count = 0
    async for prod in db.products.find():
        kat = prod.get('kategori', 'Branding')
        default_img = IMAGES.get(kat, IMAGES['Branding'])
        img = prod.get('image_url') or ''
        if len(img) < 5:
            img = default_img
            
        await db.products.update_one({'_id': prod['_id']}, {'$set': {'is_public': True, 'image_url': img}})
        count += 1
    print(f'Successfully updated {count} products in db.madatama')

asyncio.run(p())
