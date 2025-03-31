import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore as getFirestoreOriginal, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth as getAuthOriginal, Auth } from 'firebase/auth';
import { getStorage as getStorageOriginal, FirebaseStorage } from 'firebase/storage';

// Global variables for Firebase instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

// Flag to track initialization
let initialized = false;

/**
 * Initialize all Firebase services at once
 */
export function initializeFirebaseServices(): boolean {
  // Skip on server-side
  if (typeof window === 'undefined') {
    console.log('[Firebase] Skipping initialization on server side');
    return false;
  }

  // If already initialized, return true
  if (initialized) {
    console.log('[Firebase] Already initialized');
    return true;
  }

  try {
    // Get config from environment variables
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    };

    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    // Initialize all services
    db = getFirestoreOriginal(app);
    auth = getAuthOriginal(app);
    storage = getStorageOriginal(app);

    // Enable persistence for Firestore
    if (db) {
      enableIndexedDbPersistence(db).catch((err) => {
        console.warn(
          `[Firebase] Persistence issue: ${
            err.code === 'failed-precondition'
              ? 'Multiple tabs open, persistence enabled in first tab only'
              : err.code === 'unimplemented'
              ? 'Browser does not support persistence'
              : err.message
          }`
        );
      });
    }

    initialized = true;
    console.log('[Firebase] All services initialized successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Error initializing Firebase:', error);
    return false;
  }
}

// Initialize Firebase immediately when this module is imported (client-side only)
if (typeof window !== 'undefined') {
  initializeFirebaseServices();
}

// Export instances directly
export { app, db, auth, storage };

// Export safe accessor functions that ensure Firebase is initialized
export function getFirestoreSafely(): Firestore | null {
  if (!initialized && typeof window !== 'undefined') {
    initializeFirebaseServices();
  }
  return db;
}

export function getAuthSafely(): Auth | null {
  if (!initialized && typeof window !== 'undefined') {
    initializeFirebaseServices();
  }
  return auth;
}

export function getStorageSafely(): FirebaseStorage | null {
  if (!initialized && typeof window !== 'undefined') {
    initializeFirebaseServices();
  }
  return storage;
}

// Alias for backward compatibility
export const getFirestore = getFirestoreSafely;
export const getAuth = getAuthSafely;
export const getStorage = getStorageSafely;

// Alias for AppLayout
export const initializeFirebaseSafely = initializeFirebaseServices;