
import { getApps } from "firebase/app";
import { initializeFirebaseServices, ensureFirebaseInitializedAsync } from "@/lib/firebase";
import { bootstrapFirebase, waitForFirebaseBootstrap } from "@/utils/firebaseBootstrap";
import { diagnoseFirebaseInitialization } from "@/utils/firebaseMonitorUtils";

/**
 * Firebase Diagnostics Utility
 * 
 * This utility provides tools to diagnose and fix Firebase initialization issues.
 * It can be used to check Firebase status, run diagnostic tests, and fix common issues.
 */

/**
 * Run a comprehensive Firebase diagnostic test
 * This function checks Firebase initialization status, environment variables,
 * and attempts to initialize Firebase if it's not already initialized.
 */
export const runFirebaseDiagnostic = async (): Promise<{
  success: boolean;
  status: string;
  details: Record<string, any>;
}> => {
  console.log("=== Running Firebase Diagnostic ===");
  
  const apps = getApps();
  const isInitialized = apps.length > 0;
  
  const details: Record<string, any> = {
    initialized: isInitialized,
    appCount: apps.length,
    timestamp: new Date().toISOString(),
    environment: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Missing",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✅ Set" : "❌ Missing",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✅ Set" : "❌ Missing"
    }
  };
  
  if (isInitialized) {
    console.log("Firebase is already initialized");
    details.appDetails = {
      name: apps[0].name,
      options: {
        apiKey: !!apps[0].options.apiKey,
        authDomain: !!apps[0].options.authDomain,
        projectId: !!apps[0].options.projectId,
        storageBucket: !!apps[0].options.storageBucket,
        messagingSenderId: !!apps[0].options.messagingSenderId,
        appId: !!apps[0].options.appId
      }
    };
    
    return {
      success: true,
      status: "Firebase is already initialized",
      details
    };
  }
  
  console.log("Firebase is not initialized, attempting to initialize...");
  
  // Try to initialize Firebase using the bootstrap utility
  try {
    const bootstrapSuccess = await bootstrapFirebase();
    details.bootstrapAttempt = bootstrapSuccess ? "✅ Success" : "❌ Failed";
    
    if (bootstrapSuccess) {
      return {
        success: true,
        status: "Firebase initialized successfully via bootstrap",
        details
      };
    }
    
    // If bootstrap failed, try direct initialization
    console.log("Bootstrap failed, trying direct initialization...");
    const directSuccess = initializeFirebaseServices();
    details.directInitAttempt = directSuccess ? "✅ Success" : "❌ Failed";
    
    if (directSuccess) {
      return {
        success: true,
        status: "Firebase initialized successfully via direct initialization",
        details
      };
    }
    
    // If direct initialization failed, try async initialization
    console.log("Direct initialization failed, trying async initialization...");
    const asyncSuccess = await ensureFirebaseInitializedAsync();
    details.asyncInitAttempt = asyncSuccess ? "✅ Success" : "❌ Failed";
    
    if (asyncSuccess) {
      return {
        success: true,
        status: "Firebase initialized successfully via async initialization",
        details
      };
    }
    
    // If all initialization attempts failed, return failure
    return {
      success: false,
      status: "All Firebase initialization attempts failed",
      details
    };
  } catch (error) {
    console.error("Error during Firebase diagnostic:", error);
    details.error = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      status: "Error during Firebase diagnostic",
      details
    };
  }
};

/**
 * Check if Firebase is initialized and return detailed status
 */
export const checkFirebaseStatus = (): {
  initialized: boolean;
  appCount: number;
  appDetails: any | null;
} => {
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
 * Fix common Firebase initialization issues
 * This function attempts to fix common Firebase initialization issues
 * by trying multiple initialization methods with increasing delays.
 */
export const fixFirebaseInitialization = async (): Promise<boolean> => {
  console.log("=== Attempting to fix Firebase initialization ===");
  
  // Check if Firebase is already initialized
  const status = checkFirebaseStatus();
  if (status.initialized) {
    console.log("Firebase is already initialized, no fix needed");
    return true;
  }
  
  // Try multiple initialization methods with increasing delays
  const methods = [
    { name: "Bootstrap", fn: bootstrapFirebase },
    { name: "Direct", fn: () => Promise.resolve(initializeFirebaseServices()) },
    { name: "Async", fn: ensureFirebaseInitializedAsync }
  ];
  
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const method of methods) {
      try {
        console.log(`Attempt ${attempt + 1}/3: Trying ${method.name} initialization...`);
        const success = await method.fn();
        
        if (success) {
          console.log(`${method.name} initialization successful on attempt ${attempt + 1}`);
          return true;
        }
        
        console.log(`${method.name} initialization failed on attempt ${attempt + 1}`);
      } catch (error) {
        console.error(`Error during ${method.name} initialization (attempt ${attempt + 1}):`, error);
      }
      
      // Wait before trying the next method
      await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  
  console.error("All Firebase initialization attempts failed");
  return false;
};

/**
 * Verify Firebase environment variables
 * This function checks if all required Firebase environment variables are set
 */
export const verifyFirebaseEnvironment = (): {
  valid: boolean;
  missing: string[];
  details: Record<string, string>;
} => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
  ];
  
  const details: Record<string, string> = {};
  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    details[varName] = value ? "✅ Set" : "❌ Missing";
    
    if (!value) {
      missing.push(varName);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    details
  };
};

/**
 * Run a quick Firebase health check
 * This function checks Firebase initialization status and environment variables
 * and returns a simple health status
 */
export const runFirebaseHealthCheck = async (): Promise<{
  healthy: boolean;
  status: string;
  details: Record<string, any>;
}> => {
  // Check environment variables
  const envCheck = verifyFirebaseEnvironment();
  
  // Check initialization status
  const initStatus = checkFirebaseStatus();
  
  // If environment variables are missing, return unhealthy
  if (!envCheck.valid) {
    return {
      healthy: false,
      status: "Missing Firebase environment variables",
      details: {
        environment: envCheck.details,
        missingVars: envCheck.missing,
        initialization: initStatus
      }
    };
  }
  
  // If Firebase is not initialized, try to initialize it
  if (!initStatus.initialized) {
    const bootstrapped = await waitForFirebaseBootstrap();
    
    if (!bootstrapped) {
      return {
        healthy: false,
        status: "Firebase could not be initialized",
        details: {
          environment: envCheck.details,
          initialization: {
            ...initStatus,
            bootstrapAttempt: "❌ Failed"
          }
        }
      };
    }
  }
  
  // If we got here, Firebase is healthy
  return {
    healthy: true,
    status: "Firebase is healthy",
    details: {
      environment: envCheck.details,
      initialization: {
        ...initStatus,
        bootstrapAttempt: initStatus.initialized ? "✅ Already initialized" : "✅ Success"
      }
    }
  };
};
