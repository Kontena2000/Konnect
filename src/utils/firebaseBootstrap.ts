import { getApps } from "firebase/app";
import { initializeFirebaseServices, ensureFirebaseInitializedAsync } from "@/lib/firebase";
import { diagnoseFirebaseInitialization } from "@/utils/firebaseMonitorUtils";

/**
 * Firebase Bootstrap Utility
 * 
 * This utility provides a centralized way to bootstrap Firebase initialization
 * at the earliest possible point in the application lifecycle.
 */

// Track bootstrap status
let bootstrapAttempted = false;
let bootstrapComplete = false;
let bootstrapPromise: Promise<boolean> | null = null;

/**
 * Bootstrap Firebase initialization
 * This function should be called as early as possible in the application lifecycle
 */
export const bootstrapFirebase = async (): Promise<boolean> => {
  // If bootstrap has already been attempted, return the existing promise
  if (bootstrapAttempted && bootstrapPromise) {
    return bootstrapPromise;
  }
  
  // If bootstrap is already complete, return true immediately
  if (bootstrapComplete) {
    return true;
  }
  
  // Mark bootstrap as attempted
  bootstrapAttempted = true;
  
  // Create a new bootstrap promise
  bootstrapPromise = new Promise<boolean>(async (resolve) => {
    console.log("[FirebaseBootstrap] Starting Firebase bootstrap...");
    
    try {
      // Check if Firebase is already initialized
      if (getApps().length > 0) {
        console.log("[FirebaseBootstrap] Firebase already initialized");
        bootstrapComplete = true;
        resolve(true);
        return;
      }
      
      // Try direct initialization first
      try {
        const { initializeApp } = await import("firebase/app");
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
        
        if (!firebaseConfig.apiKey) {
          console.error("[FirebaseBootstrap] Missing API key");
          throw new Error("Missing Firebase API key");
        }
        
        // Only initialize if no apps exist yet
        if (getApps().length === 0) {
          initializeApp(firebaseConfig);
          console.log("[FirebaseBootstrap] Direct initialization successful");
          bootstrapComplete = true;
          resolve(true);
          return;
        }
      } catch (directError) {
        console.warn("[FirebaseBootstrap] Direct initialization failed:", directError);
        // Continue with other methods if direct initialization fails
      }
      
      // Try to initialize Firebase using the async method
      const success = await ensureFirebaseInitializedAsync();
      
      if (success) {
        console.log("[FirebaseBootstrap] Firebase initialized successfully");
        bootstrapComplete = true;
        resolve(true);
      } else {
        console.error("[FirebaseBootstrap] Firebase initialization failed");
        
        // Run diagnostic to help identify the issue
        await diagnoseFirebaseInitialization();
        
        // Try one more time with the synchronous method
        console.log("[FirebaseBootstrap] Attempting initialization one more time...");
        const retrySuccess = initializeFirebaseServices();
        
        if (retrySuccess) {
          console.log("[FirebaseBootstrap] Firebase initialized successfully on retry");
          bootstrapComplete = true;
          resolve(true);
        } else {
          console.error("[FirebaseBootstrap] Firebase initialization failed after retry");
          resolve(false);
        }
      }
    } catch (error) {
      console.error("[FirebaseBootstrap] Error during Firebase bootstrap:", error);
      resolve(false);
    }
  });
  
  return bootstrapPromise;
};

/**
 * Check if Firebase bootstrap is complete
 */
export const isFirebaseBootstrapped = (): boolean => {
  return bootstrapComplete;
};

/**
 * Wait for Firebase bootstrap to complete
 * This function returns a promise that resolves when Firebase bootstrap is complete
 */
export const waitForFirebaseBootstrap = async (): Promise<boolean> => {
  // If bootstrap is already complete, return true immediately
  if (bootstrapComplete) {
    return true;
  }
  
  // If bootstrap has not been attempted yet, start it
  if (!bootstrapAttempted) {
    return bootstrapFirebase();
  }
  
  // If bootstrap is in progress, wait for it to complete
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  
  // If bootstrap has been attempted but failed, try again
  return bootstrapFirebase();
};

/**
 * Safely execute a function that requires Firebase
 * This function ensures Firebase is bootstrapped before executing the function
 */
export const withBootstrappedFirebase = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage = "Firebase operation failed"
): Promise<T> => {
  try {
    // Wait for Firebase bootstrap to complete
    const bootstrapped = await waitForFirebaseBootstrap();
    if (!bootstrapped) {
      console.error(`[FirebaseBootstrap] ${errorMessage}: Firebase could not be bootstrapped`);
      return fallback;
    }
    
    // Execute the function
    return await fn();
  } catch (error) {
    console.error(`[FirebaseBootstrap] ${errorMessage}:`, error);
    return fallback;
  }
};

/**
 * Create a wrapped version of a service function that ensures Firebase is bootstrapped
 * This is useful for wrapping existing service functions that use Firebase
 */
export const withFirebaseBootstrap = <T extends (...args: any[]) => Promise<any>>(
  serviceFn: T
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await waitForFirebaseBootstrap();
    return serviceFn(...args);
  };
};