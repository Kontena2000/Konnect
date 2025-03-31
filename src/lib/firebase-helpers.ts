
import { db, auth, getFirestoreAsync, getAuthAsync } from "@/lib/firebase";
import { Firestore, DocumentReference, CollectionReference } from "firebase/firestore";
import { Auth } from "firebase/auth";

/**
 * Helper function to safely get Firestore instance
 * Throws an error if Firestore is not available
 */
export function getFirestoreOrThrow(): Firestore {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }
  return db;
}

/**
 * Helper function to safely get Auth instance
 * Throws an error if Auth is not initialized
 */
export function getAuthOrThrow(): Auth {
  if (!auth) {
    throw new Error("Auth is not initialized");
  }
  return auth;
}

/**
 * Helper function to safely get current user
 * Throws an error if user is not authenticated
 */
export function getCurrentUserOrThrow() {
  const authInstance = getAuthOrThrow();
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error("User is not authenticated");
  }
  return user;
}

/**
 * Helper function to safely create a document reference
 */
export function safeDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  const firestore = getFirestoreOrThrow();
  return DocumentReference.prototype.constructor(firestore, path, ...pathSegments);
}

/**
 * Helper function to safely create a collection reference
 */
export function safeCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  const firestore = getFirestoreOrThrow();
  return CollectionReference.prototype.constructor(firestore, path, ...pathSegments);
}

/**
 * Safely execute a Firestore operation with proper error handling
 */
export async function safeFirestoreOperation<T>(
  operation: (firestore: Firestore) => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    // Try to get Firestore instance
    const firestore = await getFirestoreAsync();
    return await operation(firestore);
  } catch (error) {
    console.error("Firestore operation failed:", error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Safely execute an Auth operation with proper error handling
 */
export async function safeAuthOperation<T>(
  operation: (auth: Auth) => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    // Try to get Auth instance
    const authInstance = await getAuthAsync();
    return await operation(authInstance);
  } catch (error) {
    console.error("Auth operation failed:", error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
