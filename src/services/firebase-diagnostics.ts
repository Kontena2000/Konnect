
import { calculatorDebug } from './calculatorDebug';
import { db } from '@/lib/firebase';

/**
 * Comprehensive Firebase diagnostics utility
 * This utility helps diagnose Firebase initialization and connection issues
 */
export const firebaseDiagnostics = {
  /**
   * Run a complete diagnostic check on Firebase services
   */
  async runDiagnostics() {
    console.log('🔍 Starting Firebase diagnostics...');
    
    const results = {
      firebaseInitialized: false,
      firestoreAvailable: false,
      authAvailable: false,
      storageAvailable: false,
      databaseAvailable: false,
      firestoreReadTest: false,
      firestoreWriteTest: false,
      errors: [] as string[]
    };
    
    try {
      // Check if Firebase app is initialized
      const firebaseInitCheck = this.checkFirebaseInitialization();
      results.firebaseInitialized = firebaseInitCheck.success;
      
      if (!firebaseInitCheck.success) {
        results.errors.push(`Firebase initialization failed: ${firebaseInitCheck.error}`);
        console.error('❌ Firebase initialization failed:', firebaseInitCheck.error);
        return results;
      }
      
      console.log('✅ Firebase app is initialized');
      
      // Check Firestore
      const firestoreCheck = await this.checkFirestore();
      results.firestoreAvailable = firestoreCheck.success;
      
      if (!firestoreCheck.success) {
        results.errors.push(`Firestore check failed: ${firestoreCheck.error}`);
        console.error('❌ Firestore check failed:', firestoreCheck.error);
      } else {
        console.log('✅ Firestore is available');
        
        // Only run read/write tests if Firestore is available
        const readTest = await this.testFirestoreRead();
        results.firestoreReadTest = readTest.success;
        
        if (!readTest.success) {
          results.errors.push(`Firestore read test failed: ${readTest.error}`);
          console.error('❌ Firestore read test failed:', readTest.error);
        } else {
          console.log('✅ Firestore read test passed');
        }
        
        const writeTest = await this.testFirestoreWrite();
        results.firestoreWriteTest = writeTest.success;
        
        if (!writeTest.success) {
          results.errors.push(`Firestore write test failed: ${writeTest.error}`);
          console.error('❌ Firestore write test failed:', writeTest.error);
        } else {
          console.log('✅ Firestore write test passed');
        }
      }
      
      // Check Auth
      const authCheck = this.checkAuth();
      results.authAvailable = authCheck.success;
      
      if (!authCheck.success) {
        results.errors.push(`Auth check failed: ${authCheck.error}`);
        console.error('❌ Auth check failed:', authCheck.error);
      } else {
        console.log('✅ Firebase Auth is available');
      }
      
      // Check Storage
      const storageCheck = this.checkStorage();
      results.storageAvailable = storageCheck.success;
      
      if (!storageCheck.success) {
        results.errors.push(`Storage check failed: ${storageCheck.error}`);
        console.error('❌ Storage check failed:', storageCheck.error);
      } else {
        console.log('✅ Firebase Storage is available');
      }
      
      // Check Realtime Database
      const databaseCheck = this.checkRealtimeDatabase();
      results.databaseAvailable = databaseCheck.success;
      
      if (!databaseCheck.success) {
        results.errors.push(`Realtime Database check failed: ${databaseCheck.error}`);
        console.error('❌ Realtime Database check failed:', databaseCheck.error);
      } else {
        console.log('✅ Firebase Realtime Database is available');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push(`Unexpected error during diagnostics: ${errorMessage}`);
      console.error('❌ Unexpected error during diagnostics:', error);
    }
    
    console.log('🔍 Firebase diagnostics completed');
    console.log('Results:', results);
    
    return results;
  },
  
  /**
   * Check if Firebase app is properly initialized
   */
  checkFirebaseInitialization() {
    try {
      // Check if firebase/app is available
      const firebase = require('firebase/app');
      
      // Check if we have a Firebase app instance
      if (!firebase.getApps().length) {
        return { 
          success: false, 
          error: 'No Firebase app instance found. Firebase may not be initialized.' 
        };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Check if Firestore is available
   */
  async checkFirestore() {
    try {
      // Check if firebase/firestore is available
      const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
      
      // Try to get a Firestore instance
      const firestore = getFirestore();
      
      if (!firestore) {
        return { 
          success: false, 
          error: 'Failed to get Firestore instance' 
        };
      }
      
      // Try a simple query to verify connection
      try {
        // Try to access a collection that should exist
        const testQuery = query(collection(firestore, 'matrix_calculator'), limit(1));
        await getDocs(testQuery);
        return { success: true };
      } catch (queryError) {
        return { 
          success: false, 
          error: `Firestore query failed: ${queryError instanceof Error ? queryError.message : String(queryError)}` 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Test reading from Firestore
   */
  async testFirestoreRead() {
    try {
      const { collection, getDocs, limit, query } = require('firebase/firestore');
      
      // Try to read from a collection that should exist
      const testQuery = query(collection(db, 'matrix_calculator'), limit(1));
      const snapshot = await getDocs(testQuery);
      
      return { 
        success: true, 
        data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Test writing to Firestore
   */
  async testFirestoreWrite() {
    try {
      const { collection, addDoc, deleteDoc, serverTimestamp } = require('firebase/firestore');
      
      // Create a test document
      const testDoc = {
        test: true,
        timestamp: serverTimestamp(),
        message: 'Firebase diagnostics test'
      };
      
      // Try to write to a test collection
      const docRef = await addDoc(collection(db, 'diagnostics_tests'), testDoc);
      
      // Clean up by deleting the test document
      await deleteDoc(docRef);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Check if Firebase Auth is available
   */
  checkAuth() {
    try {
      // Check if firebase/auth is available
      const { getAuth } = require('firebase/auth');
      
      // Try to get an Auth instance
      const auth = getAuth();
      
      if (!auth) {
        return { 
          success: false, 
          error: 'Failed to get Auth instance' 
        };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Check if Firebase Storage is available
   */
  checkStorage() {
    try {
      // Check if firebase/storage is available
      const { getStorage } = require('firebase/storage');
      
      // Try to get a Storage instance
      const storage = getStorage();
      
      if (!storage) {
        return { 
          success: false, 
          error: 'Failed to get Storage instance' 
        };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Check if Firebase Realtime Database is available
   */
  checkRealtimeDatabase() {
    try {
      // Check if firebase/database is available
      const { getDatabase } = require('firebase/database');
      
      // Try to get a Database instance
      const database = getDatabase();
      
      if (!database) {
        return { 
          success: false, 
          error: 'Failed to get Database instance' 
        };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },
  
  /**
   * Get Firebase configuration
   */
  getFirebaseConfig() {
    try {
      // Try to access the Firebase config
      const firebase = require('firebase/app');
      const app = firebase.getApps()[0];
      
      if (!app) {
        return { 
          success: false, 
          error: 'No Firebase app instance found' 
        };
      }
      
      // Get the options but remove sensitive information
      const options = app.options;
      const safeOptions = {
        apiKey: options.apiKey ? '✓ Present' : '✗ Missing',
        authDomain: options.authDomain,
        projectId: options.projectId,
        storageBucket: options.storageBucket ? '✓ Present' : '✗ Missing',
        messagingSenderId: options.messagingSenderId ? '✓ Present' : '✗ Missing',
        appId: options.appId ? '✓ Present' : '✗ Missing',
      };
      
      return { 
        success: true, 
        config: safeOptions 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
};

/**
 * Run a quick check of Firebase Firestore
 */
export async function quickFirestoreCheck() {
  console.log('🔍 Running quick Firestore check...');
  
  try {
    // Check if Firebase is initialized
    const initCheck = firebaseDiagnostics.checkFirebaseInitialization();
    if (!initCheck.success) {
      console.error('❌ Firebase initialization failed:', initCheck.error);
      return { success: false, error: initCheck.error };
    }
    
    // Check if Firestore is available
    const firestoreCheck = await firebaseDiagnostics.checkFirestore();
    if (!firestoreCheck.success) {
      console.error('❌ Firestore check failed:', firestoreCheck.error);
      return { success: false, error: firestoreCheck.error };
    }
    
    console.log('✅ Firestore is available and working');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Unexpected error during Firestore check:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Fix common Firebase initialization issues
 */
export function fixFirebaseInitialization() {
  try {
    // Check if firebase/app is available
    const firebase = require('firebase/app');
    
    // Check if we already have an initialized app
    if (firebase.getApps().length > 0) {
      console.log('✅ Firebase app is already initialized');
      return { success: true, message: 'Firebase app is already initialized' };
    }
    
    // Try to initialize Firebase with environment variables
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
    
    // Check if we have the required config
    if (!config.apiKey || !config.projectId) {
      return { 
        success: false, 
        message: 'Missing required Firebase configuration in environment variables' 
      };
    }
    
    // Initialize Firebase
    firebase.initializeApp(config);
    
    console.log('✅ Firebase app initialized successfully');
    return { success: true, message: 'Firebase app initialized successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to fix Firebase initialization:', error);
    return { success: false, message: errorMessage };
  }
}
