
import { getApps } from "firebase/app";
import { initializeFirebaseServices } from "@/lib/firebase";
import { ensureFirebaseInitialized } from "@/utils/firebaseInitializer";

/**
 * Firebase Monitor Utilities
 * 
 * This utility helps diagnose and fix Firebase initialization issues
 * specifically for the firebase-monitor.ts service.
 */

/**
 * Check if Firebase is properly initialized
 * @returns Object with initialization status and details
 */
export const checkFirebaseStatus = () => {
  const apps = getApps();
  const isInitialized = apps.length > 0;
  
  return {
    initialized: isInitialized,
    appCount: apps.length,
    appDetails: isInitialized ? {
      name: apps[0].name,
      options: {
        apiKey: !!apps[0].options.apiKey,
        authDomain: !!apps[0].options.authDomain,
        projectId: !!apps[0].options.projectId,
        storageBucket: !!apps[0].options.storageBucket,
        messagingSenderId: !!apps[0].options.messagingSenderId,
        appId: !!apps[0].options.appId
      }
    } : null
  };
};

/**
 * Initialize Firebase Monitor safely
 * This function ensures Firebase is initialized before the monitor starts
 */
export const initializeFirebaseMonitorSafely = async (): Promise<boolean> => {
  console.log("[Firebase Monitor] Starting initialization...");
  
  try {
    // First check if Firebase is already initialized
    const status = checkFirebaseStatus();
    if (status.initialized) {
      console.log("[Firebase Monitor] Firebase already initialized");
      return true;
    }
    
    // Try to initialize Firebase
    console.log("[Firebase Monitor] Firebase not initialized, initializing...");
    const initialized = await ensureFirebaseInitialized();
    
    if (initialized) {
      console.log("[Firebase Monitor] Firebase initialized successfully");
      return true;
    } else {
      console.error("[Firebase Monitor] Firebase initialization failed");
      return false;
    }
  } catch (error) {
    console.error("[Firebase Monitor] Error during initialization:", error);
    return false;
  }
};

/**
 * Safely execute a Firebase Monitor operation with proper initialization check
 * This function ensures Firebase is initialized before executing monitor operations
 */
export const safeMonitorOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage = "Firebase monitor operation failed"
): Promise<T> => {
  try {
    // Ensure Firebase is initialized first
    const initialized = await initializeFirebaseMonitorSafely();
    if (!initialized) {
      console.error("[Firebase Monitor] Firebase could not be initialized");
      return fallback;
    }
    
    // Execute the operation
    return await operation();
  } catch (error) {
    console.error(`[Firebase Monitor] ${errorMessage}:`, error);
    return fallback;
  }
};

/**
 * Diagnostic function to check Firebase initialization status
 * Logs detailed information about Firebase initialization
 */
export const diagnoseFirebaseInitialization = async (): Promise<void> => {
  console.log("=== Firebase Initialization Diagnostic ===");
  
  // Check current status
  const status = checkFirebaseStatus();
  console.log(`Firebase initialized: ${status.initialized ? "✅ Yes" : "❌ No"}`);
  console.log(`Firebase app count: ${status.appCount}`);
  
  if (status.initialized) {
    console.log("Firebase app details:", status.appDetails);
  } else {
    console.log("Attempting to initialize Firebase...");
    const initialized = await ensureFirebaseInitialized();
    console.log(`Initialization attempt result: ${initialized ? "✅ Success" : "❌ Failed"}`);
    
    // Check environment variables
    console.log("Environment variable check:");
    console.log(`NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✅ Set" : "❌ Missing"}`);
    console.log(`NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✅ Set" : "❌ Missing"}`);
  }
  
  console.log("=== End of Diagnostic ===");
};
