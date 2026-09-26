import pymongo
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['bukuku']
sales = list(db.sales.find({}, {"_id":0, "nama":1, "custom_image":1, "pembeli":1}).sort("_id", -1).limit(5))
for s in sales:
    print(s)
