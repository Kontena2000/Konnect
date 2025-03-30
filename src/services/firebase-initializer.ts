import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { calculatorDebug } from './calculatorDebug';

/**
 * Ensures Firebase is initialized before accessing any Firebase services
 * This is a utility function to prevent the "No Firebase App '[DEFAULT]' has been created" error
 */
export function initializeFirebaseIfNeeded(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
  error?: string;
} {
  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      const app = getApps()[0];
      
      try {
        const db = getFirestore(app);
        const auth = getAuth(app);
        console.log('Firebase services retrieved from existing app');
        return { app, db, auth };
      } catch (serviceError) {
        console.error('Error getting Firebase services from existing app:', serviceError);
        calculatorDebug.error('Error getting Firebase services from existing app', serviceError);
        return { 
          app, 
          db: null, 
          auth: null, 
          error: serviceError instanceof Error ? serviceError.message : 'Unknown error getting Firebase services' 
        };
      }
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
      calculatorDebug.error('Missing required Firebase configuration', 'Configuration incomplete');
      return { 
        app: null, 
        db: null, 
        auth: null, 
        error: 'Missing required Firebase configuration' 
      };
    }

    // Initialize Firebase
    console.log('Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain
    });
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('Firebase initialized successfully');
    calculatorDebug.log('Firebase initialized successfully');
    return { app, db, auth };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    calculatorDebug.error('Error initializing Firebase', error);
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
export function getFirestoreSafely(): Firestore | null {
  const { db, error } = initializeFirebaseIfNeeded();
  if (error) {
    console.error('Error getting Firestore:', error);
    calculatorDebug.error('Error getting Firestore', error);
  }
  return db;
}

/**
 * Safely access Auth by ensuring Firebase is initialized first
 */
export function getAuthSafely(): Auth | null {
  const { auth, error } = initializeFirebaseIfNeeded();
  if (error) {
    console.error('Error getting Auth:', error);
    calculatorDebug.error('Error getting Auth', error);
  }
  return auth;
}

/**
 * Initialize Firebase safely and return initialization status
 * This is a wrapper around initializeFirebaseIfNeeded for components
 */
export function initializeFirebaseSafely(): boolean {
  const result = initializeFirebaseIfNeeded();
  return result.app !== null && !result.error;
}

/**
 * Check if all Firebase services are available and working
 */
export function checkFirebaseServices(): {
  initialized: boolean;
  firestoreAvailable: boolean;
  authAvailable: boolean;
  error?: string;
} {
  const { app, db, auth, error } = initializeFirebaseIfNeeded();
  
  return {
    initialized: app !== null,
    firestoreAvailable: db !== null,
    authAvailable: auth !== null,
    error
  };
}