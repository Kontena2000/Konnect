
import { getApps } from "firebase/app";
import { 
  initializeFirebaseServices, 
  getFirestoreSafely, 
  getAuthSafely, 
  getStorageSafely 
} from "@/lib/firebase";
import { Firestore } from "firebase/firestore";
import { Auth } from "firebase/auth";
import { FirebaseStorage } from "firebase/storage";

// Maximum number of initialization attempts
const MAX_INIT_ATTEMPTS = 3;
// Delay between initialization attempts (ms)
const INIT_RETRY_DELAY = 500;

/**
 * Initialize Firebase at application startup
 * This should be called as early as possible in the application lifecycle
 */
export const initializeFirebaseOnStartup = async (): Promise<boolean> => {
  console.log("[Firebase Initializer] Starting Firebase initialization...");
  
  try {
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      console.log("[Firebase Initializer] Firebase already initialized");
      return true;
    }
    
    // Initialize Firebase
    const success = initializeFirebaseServices();
    
    if (success) {
      console.log("[Firebase Initializer] Firebase initialized successfully");
      return true;
    } else {
      console.error("[Firebase Initializer] Firebase initialization failed");
      return false;
    }
  } catch (error) {
    console.error("[Firebase Initializer] Error initializing Firebase:", error);
    return false;
  }
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

  console.log("[Firebase Initializer] Firebase not initialized, attempting to initialize...");
  
  // Try to initialize Firebase
  for (let attempt = 1; attempt <= MAX_INIT_ATTEMPTS; attempt++) {
    try {
      const success = initializeFirebaseServices();
      if (success) {
        console.log(`[Firebase Initializer] Successfully initialized on attempt ${attempt}`);
        return true;
      }
      
      console.warn(`[Firebase Initializer] Initialization attempt ${attempt} failed, retrying...`);
      
      // Wait before retrying
      if (attempt < MAX_INIT_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, INIT_RETRY_DELAY));
      }
    } catch (error) {
      console.error(`[Firebase Initializer] Error during initialization attempt ${attempt}:`, error);
      
      // Wait before retrying
      if (attempt < MAX_INIT_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, INIT_RETRY_DELAY));
      }
    }
  }
  
  console.error(`[Firebase Initializer] Failed to initialize after ${MAX_INIT_ATTEMPTS} attempts`);
  return false;
};

/**
 * Get Firestore instance with initialization check
 * This function ensures Firebase is initialized before returning Firestore
 */
export const getFirestore = async (): Promise<Firestore> => {
  await ensureFirebaseInitialized();
  const firestore = getFirestoreSafely();
  if (!firestore) {
    throw new Error("[Firebase Initializer] Failed to get Firestore instance");
  }
  return firestore;
};

/**
 * Get Auth instance with initialization check
 * This function ensures Firebase is initialized before returning Auth
 */
export const getAuth = async (): Promise<Auth> => {
  await ensureFirebaseInitialized();
  const auth = getAuthSafely();
  if (!auth) {
    throw new Error("[Firebase Initializer] Failed to get Auth instance");
  }
  return auth;
};

/**
 * Get Storage instance with initialization check
 * This function ensures Firebase is initialized before returning Storage
 */
export const getStorage = async (): Promise<FirebaseStorage> => {
  await ensureFirebaseInitialized();
  const storage = getStorageSafely();
  if (!storage) {
    throw new Error("[Firebase Initializer] Failed to get Storage instance");
  }
  return storage;
};

/**
 * Safely execute a Firebase operation with initialization check and error handling
 * This function ensures Firebase is initialized before executing the operation
 * and handles common Firebase errors
 */
export const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = "Firebase operation failed",
  maxRetries: number = 2
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Ensure Firebase is initialized first
      const initialized = await ensureFirebaseInitialized();
      if (!initialized) {
        throw new Error("[Firebase Initializer] Firebase could not be initialized");
      }
      
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for Firebase initialization errors
      if (lastError.message.includes("no Firebase App") || 
          lastError.message.includes("Firebase not initialized") ||
          lastError.message.includes("could not be initialized")) {
        
        console.error(`[Firebase Initializer] Operation failed due to initialization error (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);
        
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
  console.error(`[Firebase Initializer] ${errorMessage} after ${maxRetries + 1} attempts:`, lastError);
  throw new Error(`${errorMessage}: ${lastError?.message || "Unknown error"}`);
};

/**
 * Create a wrapped version of a service function that ensures Firebase is initialized
 * This is useful for wrapping existing service functions that use Firebase
 */
export const withFirebaseInit = <T extends (...args: any[]) => Promise<any>>(
  serviceFn: T
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await ensureFirebaseInitialized();
    return serviceFn(...args);
  };
};
