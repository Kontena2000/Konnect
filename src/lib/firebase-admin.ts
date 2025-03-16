
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Failed to initialize admin app:', error);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const realTimeDb = admin.database();

export { admin, db, auth, storage, realTimeDb };
