import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Initialize Firebase at the module level to ensure it happens immediately
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Define the initialization function so it can be called again if needed
function initializeFirebase(): boolean {
  try {
    // Skip initialization on server side
    if (typeof window === 'undefined') {
      console.log('Skipping Firebase initialization on server side');
      return false;
    }

    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      app = getApps()[0];
      try {
        db = getFirestore(app);
        auth = getAuth(app);
        console.log('Firebase services retrieved from existing app');
        return true;
      } catch (error) {
        console.error('Error getting Firebase services from existing app:', error);
        return false;
      }
    }

    // Initialize Firebase with config
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    // Log environment variables availability (without exposing values)
    console.log('Firebase environment variables check:', {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    });

    // Check if required config values are present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
      console.error('Missing required Firebase configuration');
      return false;
    }

    // Initialize Firebase
    console.log('Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain
    });
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Enable persistence for Firestore
    if (typeof window !== 'undefined' && db) {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      });
    }

    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// Call the initialization function immediately
initializeFirebase();

/**
 * Safely access Firestore by ensuring Firebase is initialized
 */
export function getFirestoreSafely(): Firestore | null {
  if (!db && typeof window !== 'undefined') {
    console.warn('Attempting to access Firestore before initialization');
    // Try to initialize again if needed
    if (app) {
      try {
        db = getFirestore(app);
      } catch (error) {
        console.error('Error getting Firestore:', error);
      }
    } else {
      // Try to initialize Firebase again
      initializeFirebase();
    }
  }
  return db;
}

/**
 * Safely access Auth by ensuring Firebase is initialized
 */
export function getAuthSafely(): Auth | null {
  if (!auth && typeof window !== 'undefined') {
    console.warn('Attempting to access Auth before initialization');
    // Try to initialize again if needed
    if (app) {
      try {
        auth = getAuth(app);
      } catch (error) {
        console.error('Error getting Auth:', error);
      }
    } else {
      // Try to initialize Firebase again
      initializeFirebase();
    }
  }
  return auth;
}

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return app !== null && db !== null && auth !== null;
}

/**
 * Force Firebase initialization - useful for components that need to ensure Firebase is ready
 */
export function initializeFirebaseSafely(): { 
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  error?: string;
} {
  // Skip on server side
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null, error: 'Server-side rendering' };
  }
  
  // If already initialized, return existing instances
  if (app && db && auth) {
    return { app, db, auth };
  }
  
  // Otherwise, re-run the initialization
  try {
    if (!app) {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      };
      app = initializeApp(firebaseConfig);
    }
    
    if (!db) {
      db = getFirestore(app);
    }
    
    if (!auth) {
      auth = getAuth(app);
    }
    
    return { app, db, auth };
  } catch (error) {
    console.error('Error in initializeFirebaseSafely:', error);
    return { 
      app: null, 
      db: null, 
      auth: null, 
      error: error instanceof Error ? error.message : 'Unknown error initializing Firebase'
    };
  }
}

/**
 * Alias for initializeFirebaseSafely for backward compatibility
 */
export function initializeFirebaseIfNeeded(): { 
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  error?: string;
} {
  return initializeFirebaseSafely();
}

// Export the Firebase instances
export { app, auth, db };