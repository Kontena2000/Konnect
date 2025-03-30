
import { getApps } from "firebase/app";

/**
 * Firebase Debug Utility
 * 
 * This utility helps diagnose common Firebase initialization issues
 * without modifying the core firebase.ts file.
 */

export const checkFirebaseInitialization = () => {
  const apps = getApps();
  const isInitialized = apps.length > 0;
  
  console.log("=== Firebase Initialization Check ===");
  console.log(`Firebase initialized: ${isInitialized ? "✅ Yes" : "❌ No"}`);
  
  if (isInitialized) {
    console.log(`Number of Firebase apps: ${apps.length}`);
    console.log(`App name: ${apps[0].name}`);
    console.log(`App options:`, {
      apiKey: apps[0].options.apiKey ? "✅ Set" : "❌ Missing",
      authDomain: apps[0].options.authDomain ? "✅ Set" : "❌ Missing",
      projectId: apps[0].options.projectId ? "✅ Set" : "❌ Missing",
      storageBucket: apps[0].options.storageBucket ? "✅ Set" : "❌ Missing",
      messagingSenderId: apps[0].options.messagingSenderId ? "✅ Set" : "❌ Missing",
      appId: apps[0].options.appId ? "✅ Set" : "❌ Missing"
    });
  } else {
    console.warn("Firebase is not initialized. Check your firebase.ts file and environment variables.");
    
    // Check environment variables without exposing values
    console.log("Environment variable check:");
    console.log(`NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✅ Set" : "❌ Missing"}`);
  }
  
  return isInitialized;
};

/**
 * Safely access Firebase services with error handling
 * This helps prevent "No Firebase App has been created" errors
 */
export const safeFirebaseAccess = <T>(
  accessFn: () => T,
  fallback: T,
  errorMessage = "Firebase access error"
): T => {
  try {
    // First check if Firebase is initialized
    if (getApps().length === 0) {
      console.error("Firebase not initialized when attempting to access services");
      return fallback;
    }
    
    return accessFn();
  } catch (error) {
    console.error(errorMessage, error);
    return fallback;
  }
};

/**
 * Utility to safely execute Firebase operations with proper error handling
 */
export const withFirebaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    // Check if Firebase is initialized first
    if (getApps().length === 0) {
      throw new Error("Firebase not initialized");
    }
    
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // Enhanced error information
    if (error instanceof Error) {
      // Check for common Firebase errors
      if (error.message.includes("no Firebase App")) {
        console.error("Firebase initialization error. Make sure firebase.ts is properly configured.");
        checkFirebaseInitialization();
      }
      
      throw new Error(`${errorMessage}: ${error.message}`);
    }
    
    throw new Error(errorMessage);
  }
};
