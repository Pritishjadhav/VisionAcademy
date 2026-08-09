const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // wait, I don't have the service account json directly maybe? let's check how lib/firebase/admin.ts initializes it.
