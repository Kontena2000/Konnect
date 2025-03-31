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
let initializationError: Error | null = null;

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

  // If initialization failed previously with an error, return rejected promise
  if (initializationError) {
    console.warn('[Firebase] Previous initialization failed:', initializationError.message);
    return Promise.resolve(false);
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
      console.log('[Firebase] Starting initialization...');
      
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

      // Check for required config values
      const requiredFields = ['apiKey', 'authDomain', 'projectId'];
      const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
      }

      // Check if Firebase is already initialized
      if (getApps().length > 0) {
        app = getApps()[0];
        console.log('[Firebase] Using existing Firebase app');
      } else {
        app = initializeApp(firebaseConfig);
        console.log('[Firebase] Created new Firebase app');
      }

      // Initialize all services
      db = getFirestoreOriginal(app);
      auth = getAuthOriginal(app);
      storage = getStorageOriginal(app);
      console.log('[Firebase] Core services initialized');

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
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('[Firebase] Error initializing Firebase:', errorObj.message);
      initializationError = errorObj;
      initializationPromise = null;
      resolve(false);
    }
  });

  return initializationPromise;
}

/**
 * Force Firebase reinitialization - useful in case of issues
 */
export function reinitializeFirebase(): Promise<boolean> {
  // Reset initialization state
  initialized = false;
  initializationPromise = null;
  initializationError = null;
  
  // Try again
  console.log('[Firebase] Forcing reinitialization...');
  return initializeFirebaseServices();
}

// Initialize Firebase immediately when this module is imported (client-side only)
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after module initialization
  setTimeout(() => {
    initializeFirebaseServices().then((success) => {
      if (success) {
        console.log('[Firebase] Initialization complete');
      } else {
        console.error('[Firebase] Initialization failed');
      }
    });
  }, 0);
}

// Export safe accessor functions that ensure Firebase is initialized
export async function getFirestoreAsync(): Promise<Firestore> {
  if (!initialized) {
    const success = await initializeFirebaseServices();
    if (!success) {
      throw new Error('Failed to initialize Firebase services');
    }
  }
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

export async function getAuthAsync(): Promise<Auth> {
  if (!initialized) {
    const success = await initializeFirebaseServices();
    if (!success) {
      throw new Error('Failed to initialize Firebase services');
    }
  }
  if (!auth) {
    throw new Error('Auth not initialized');
  }
  return auth;
}

export async function getStorageAsync(): Promise<FirebaseStorage> {
  if (!initialized) {
    const success = await initializeFirebaseServices();
    if (!success) {
      throw new Error('Failed to initialize Firebase services');
    }
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
    // Trigger initialization but don't wait for it
    initializeFirebaseServices();
  }
  return db;
}

export function getAuthSafely(): Auth | null {
  if (!initialized && typeof window !== 'undefined') {
    console.warn('[Firebase] Attempting to use