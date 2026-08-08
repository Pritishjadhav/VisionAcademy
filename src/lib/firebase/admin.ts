import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      // Remove starting/ending quotes if Vercel added them
      privateKey = privateKey.replace(/^["']|["']$/g, "");
      // Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    return null;
  }
}

const app = initAdmin();

// Use getter functions to avoid crashing the whole server component if init fails
export const adminAuth = app ? getAuth(app) : null as unknown as ReturnType<typeof getAuth>;
export const adminDb = app ? getFirestore(app) : null as unknown as ReturnType<typeof getFirestore>;
