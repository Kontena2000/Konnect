
import * as admin from 'firebase-admin';
import serviceAccount from '../../public/kontena-layout-builder-firebase-adminsdk-fbsvc-7b95c34dc4-m8hhdcwm.json';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize admin app:', error);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const realTimeDb = admin.database();

export { admin, db, auth, storage, realTimeDb };
