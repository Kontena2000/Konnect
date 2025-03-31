
import { getApps } from "firebase/app";
import { initializeFirebaseServices } from "@/lib/firebase";

/**
 * Firebase Debug Utility
 * 
 * This utility helps diagnose common Firebase initialization issues
 * without modifying the core firebase.ts file.
 */

// Maximum number of initialization attempts
const MAX_INIT_ATTEMPTS = 3;
// Delay between initialization attempts (ms)
const INIT_RETRY_DELAY = 500;

/**
 * Check if Firebase is initialized
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
 * Ensure Firebase is initialized before proceeding
 * This function will attempt to initialize Firebase if it's not already initialized
 * and will retry up to MAX_INIT_ATTEMPTS times with a delay between attempts
 */
export const ensureFirebaseInitialized = async (): Promise<boolean> => {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    return true;
  }

  console.log("[Firebase] Firebase not initialized, attempting to initialize...");
  
  // Try to initialize Firebase
  for (let attempt = 1; attempt <= MAX_INIT_ATTEMPTS; attempt++) {
    try {
      const success = initializeFirebaseServices();
      if (success) {
        console.log(`[Firebase] Successfully initialized on attempt ${attempt}`);
        return true;
      }
      
      console.warn(`[Firebase] Initialization attempt ${attempt} failed, retrying...`);
      
      // Wait before retrying
      if (attempt < MAX_INIT_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, INIT_RETRY_DELAY));
      }
    } catch (error) {
      console.error(`[Firebase] Error during initialization attempt ${attempt}:`, error);
      
      // Wait before retrying
      if (attempt < MAX_INIT_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, INIT_RETRY_DELAY));
      }
    }
  }
  
  console.error(`[Firebase] Failed to initialize after ${MAX_INIT_ATTEMPTS} attempts`);
  return false;
};

/**
 * Safely access Firebase services with error handling and initialization check
 * This helps prevent "No Firebase App has been created" errors
 */
export const safeFirebaseAccess = async <T>(
  accessFn: () => T,
  fallback: T,
  errorMessage = "Firebase access error"
): Promise<T> => {
  try {
    // Ensure Firebase is initialized before accessing services
    const initialized = await ensureFirebaseInitialized();
    if (!initialized) {
      console.error("Firebase could not be initialized when attempting to access services");
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
 * and automatic retry on initialization failures
 */
export const withFirebaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  maxRetries = 2
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Ensure Firebase is initialized first
      const initialized = await ensureFirebaseInitialized();
      if (!initialized) {
        throw new Error("Firebase could not be initialized");
      }
      
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for Firebase initialization errors
      if (lastError.message.includes("no Firebase App") || 
          lastError.message.includes("Firebase not initialized") ||
          lastError.message.includes("could not be initialized")) {
        
        console.error(`[Firebase] Operation failed due to initialization error (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);
        
        // Try to re-initialize Firebase
        await ensureFirebaseInitialized();
        
        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  // If we get here, all retries failed
  console.error(`${errorMessage} after ${maxRetries + 1} attempts:`, lastError);
  throw new Error(`${errorMessage}: ${lastError?.message || "Unknown error"}`);
};

/**
 * Utility to wrap a Firebase service function with initialization check
 * This is useful for services that need to ensure Firebase is initialized
 */
export const withFirebaseInit = <T extends (...args: any[]) => any>(
  serviceFn: T
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await ensureFirebaseInitialized();
    return serviceFn(...args) as ReturnType<T>;
  };
};
