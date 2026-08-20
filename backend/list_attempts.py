import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except:
    pass # Might already be initialized in some environments, or we just rely on default credentials if running in a certain way

try:
    from app.firebase import db
except:
    db = firestore.client()

attempts = db.collection('testAttempts').get()
print("Total testAttempts:", len(attempts))
for attempt in attempts:
    print(attempt.id, attempt.to_dict())
