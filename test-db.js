const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "vision-academy-60312" // Or whatever the project ID is. Let me read it from .firebaserc
};
// I can't read the firestore without auth if rules are enforced.
