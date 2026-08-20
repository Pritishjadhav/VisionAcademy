const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const snapshot = await db.collection('testAttempts').get();
  console.log("Total attempts:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
run();
