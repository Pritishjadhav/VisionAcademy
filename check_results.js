const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, doc } = require('firebase/firestore');

// Use the mock config or just write a quick script that requires firestore from their project.
