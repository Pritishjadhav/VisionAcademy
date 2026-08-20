const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('testAttempts').get();
  console.log("Total testAttempts:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

run();
