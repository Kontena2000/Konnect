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
let initializationInProgress = false;
let initializationPromise: Promise<boolean> | null = null;

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

  // If initialization is in progress, don't start another one
  if (initializationInProgress) {
    console.log('[Firebase] Initialization already in progress');
    return false;
  }

  try {
    initializationInProgress = true;
    
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
      console.log('[Firebase] Using existing Firebase app');
    } else {
      console.log('[Firebase] Creating new Firebase app with config:', 
        Object.keys(firebaseConfig).reduce((acc, key) => {
          // Only log if the config value exists, and only show that it exists (not the actual value)
          if (firebaseConfig[key as keyof typeof firebaseConfig]) {
            acc[key] = '✓ Set';
          } else {
            acc[key] = '✗ Missing';
          }
          return acc;
        }, {} as Record<string, string>)
      );
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
  } finally {
    initializationInProgress = false;
  }
}

/**
 * Ensure Firebase is initialized with Promise support
 * This allows for async/await usage and better error handling
 */
export function ensureFirebaseInitializedAsync(): Promise<boolean> {
  // If already initialized, resolve immediately
  if (initialized) {
    return Promise.resolve(true);
  }
  
  // If initialization is in progress, return the existing promise
  if (initializationInProgress && initializationPromise) {
    return initializationPromise;
  }
  
  // Start initialization
  initializationInProgress = true;
  
  // Create a new initialization promise
  initializationPromise = new Promise<boolean>((resolve) => {
    try {
      // Skip on server-side
      if (typeof window === 'undefined') {
        console.log('[Firebase] Skipping initialization on server side');
        resolve(false);
        return;
      }
      
      // Check if Firebase is already initialized
      if (getApps().length > 0) {
        app = getApps()[0];
        
        // Initialize services if they're not already
        if (!db) db = getFirestoreOriginal(app);
        if (!auth) auth = getAuthOriginal(app);
        if (!storage) storage = getStorageOriginal(app);
        
        initialized = true;
        console.log('[Firebase] Using existing Firebase app');
        resolve(true);
        return;
      }
      
      // Initialize Firebase
      const success = initializeFirebaseServices();
      resolve(success);
    } catch (error) {
      console.error('[Firebase] Error in ensureFirebaseInitializedAsync:', error);
      resolve(false);
    } finally {
      initializationInProgress = false;
    }
  });
  
  return initializationPromise;
}

// Initialize Firebase immediately when this module is imported (client-side only)
if (typeof window !== 'undefined') {
  // Use setTimeout to avoid blocking the main thread
  setTimeout(() => {
    initializeFirebaseServices();
  }, 0);
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

// Async versions that ensure initialization and throw if service is unavailable
export async function getFirestoreAsync(): Promise<Firestore> {
  await ensureFirebaseInitializedAsync();
  if (!db) {
    throw new Error('[Firebase] Firestore is not available');
  }
  return db;
}

export async function getAuthAsync(): Promise<Auth> {
  await ensureFirebaseInitializedAsync();
  if (!auth) {
    throw new Error('[Firebase] Auth is not available');
  }
  return auth;
}

export async function getStorageAsync(): Promise<FirebaseStorage> {
  await ensureFirebaseInitializedAsync();
  if (!storage) {
    throw new Error('[Firebase] Storage is not available');
  }
  return storage;
}

// Alias for backward compatibility
export const getFirestore = getFirestoreSafely;
export const getAuth = getAuthSafely;
export const getStorage = getStorageSafely;

// Alias for AppLayout
export const initializeFirebaseSafely = initializeFirebaseServices;

// Export initialization status check
export const isFirebaseInitialized = () => initialized;