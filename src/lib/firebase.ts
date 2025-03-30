
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Initialize Firebase at the module level to ensure it happens immediately
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Immediately invoke initialization function
(function initializeFirebase() {
  try {
    // Skip initialization on server side
    if (typeof window === 'undefined') {
      console.log('Skipping Firebase initialization on server side');
      return;
    }

    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      app = getApps()[0];
      try {
        db = getFirestore(app);
        auth = getAuth(app);
        console.log('Firebase services retrieved from existing app');
      } catch (error) {
        console.error('Error getting Firebase services from existing app:', error);
      }
      return;
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
      return;
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
          console.warn('The current browser doesn\\'t support persistence.');
        }
      });
    }

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
})();

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
export function initializeFirebaseSafely(): boolean {
  // Skip on server side
  if (typeof window === 'undefined') {
    return false;
  }
  
  // If already initialized, return true
  if (app && db && auth) {
    return true;
  }
  
  // Otherwise, re-run the initialization
  initializeFirebase();
  return app !== null && db !== null && auth !== null;
}

// Export the Firebase instances
export { app, auth, db };