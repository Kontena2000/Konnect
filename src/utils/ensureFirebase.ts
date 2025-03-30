
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Ensures Firebase is initialized before accessing any Firebase services
 * This is a utility function to prevent the "No Firebase App '[DEFAULT]' has been created" error
 */
export function ensureFirebaseInitialized(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
  error?: string;
} {
  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      const app = getApps()[0];
      const db = getFirestore(app);
      const auth = getAuth(app);
      return { app, db, auth };
    }

    // If not initialized, initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    // Check if required config values are present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
      console.error('Missing required Firebase configuration');
      return { 
        app: null, 
        db: null, 
        auth: null, 
        error: 'Missing required Firebase configuration' 
      };
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('Firebase initialized successfully');
    return { app, db, auth };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return { 
      app: null, 
      db: null, 
      auth: null, 
      error: error instanceof Error ? error.message : 'Unknown error initializing Firebase'
    };
  }
}

/**
 * Safely access Firestore by ensuring Firebase is initialized first
 */
export function safeGetFirestore(): Firestore | null {
  const { db, error } = ensureFirebaseInitialized();
  if (error) {
    console.error('Error getting Firestore:', error);
  }
  return db;
}

/**
 * Safely access Auth by ensuring Firebase is initialized first
 */
export function safeGetAuth(): Auth | null {
  const { auth, error } = ensureFirebaseInitialized();
  if (error) {
    console.error('Error getting Auth:', error);
  }
  return auth;
}
