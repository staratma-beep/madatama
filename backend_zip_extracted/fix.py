import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def p():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.madatama_db
    async for prod in db.products.find({}):
        updates = {}
        for k in ['bahan_baku', 'jasa_mitra', 'tambahan', 'harga_jual']:
            val = prod.get(k, 0)
            if 0 < val <= 500:
                updates[k] = val * 1000
        if updates:
            await db.products.update_one({'_id': prod['_id']}, {'$set': updates})
            print(f'Fixed {prod.get("nama")}: {updates}')
asyncio.run(p())
