import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Check for environment variables before initialization
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('Missing required Firebase environment variables');
}

// Log configuration for debugging
console.log('Firebase config (debug):', {
  apiKeyExists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomainExists: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Safely initialize Firebase with error handling
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  try {
    auth = getAuth(app);
    console.log('Firebase auth initialized successfully');
  } catch (authError) {
    console.error('Failed to initialize Firebase auth:', authError);
  }
  
  try {
    db = getFirestore(app);
    console.log('Firebase firestore initialized successfully');
  } catch (dbError) {
    console.error('Failed to initialize Firebase firestore:', dbError);
  }
} catch (appError) {
  console.error('Failed to initialize Firebase app:', appError);
}

// Enable persistence only in client-side environment
if (typeof window !== 'undefined' && db) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support persistence.');
    } else {
      console.error('Firebase persistence error:', err);
    }
  });
}

export { app, auth, db };