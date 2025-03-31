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
let initializationPromise: Promise<boolean> | null = null;

/**
 * Initialize all Firebase services at once
 * Returns a promise that resolves when initialization is complete
 */
export function initializeFirebaseServices(): Promise<boolean> {
  // If already initialized, return resolved promise
  if (initialized) {
    console.log('[Firebase] Already initialized');
    return Promise.resolve(true);
  }

  // If initialization is in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Skip on server-side
  if (typeof window === 'undefined') {
    console.log('[Firebase] Skipping initialization on server side');
    return Promise.resolve(false);
  }

  // Create initialization promise
  initializationPromise = new Promise<boolean>((resolve) => {
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
      resolve(true);
    } catch (error) {
      console.error('[Firebase] Error initializing Firebase:', error);
      // Reset initialization promise so we can try again
      initializationPromise = null;
      resolve(false);
    }
  });

  return initializationPromise;
}

// Initialize Firebase immediately when this module is imported (client-side only)
if (typeof window !== 'undefined') {
  initializeFirebaseServices().then((success) => {
    if (success) {
      console.log('[Firebase] Initialization complete');
    } else {
      console.error('[Firebase] Initialization failed');
    }
  });
}

// Export safe accessor functions that ensure Firebase is initialized
export async function getFirestoreAsync(): Promise<Firestore> {
  if (!initialized) {
    await initializeFirebaseServices();
  }
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

export async function getAuthAsync(): Promise<Auth> {
  if (!initialized) {
    await initializeFirebaseServices();
  }
  if (!auth) {
    throw new Error('Auth not initialized');
  }
  return auth;
}

export async function getStorageAsync(): Promise<FirebaseStorage> {
  if (!initialized) {
    await initializeFirebaseServices();
  }
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  return storage;
}

// Synchronous getters with initialization check
export function getFirestoreSafely(): Firestore | null {
  if (!initialized && typeof window !== 'undefined') {
    console.warn('[Firebase] Attempting to use Firestore before initialization is complete');
    initializeFirebaseServices();
  }
  return db;
}

export function getAuthSafely(): Auth | null {
  if (!initialized && typeof window !== 'undefined') {
    console.warn('[Firebase] Attempting to use Auth before initialization is complete');
    initializeFirebaseServices();
  }
  return auth;
}

export function getStorageSafely(): FirebaseStorage | null {
  if (!initialized && typeof window !== 'undefined') {
    console.warn('[Firebase] Attempting to use Storage before initialization is complete');
    initializeFirebaseServices();
  }
  return storage;
}

// Alias for backward compatibility
export const getFirestore = getFirestoreSafely;
export const getAuth = getAuthSafely;
export const getStorage = getStorageSafely;

// Direct exports (use with caution - may be null if called before initialization)
export { app, db, auth, storage };

// Alias for AppLayout
export const initializeFirebaseSafely = initializeFirebaseServices;

// Helper to check if Firebase is initialized
export function isFirebaseInitialized(): boolean {
  return initialized;
}