
import { db, auth } from "@/lib/firebase";
import { 
  doc, 
  collection, 
  Firestore, 
  DocumentReference, 
  CollectionReference 
} from "firebase/firestore";
import { Auth } from "firebase/auth";

/**
 * Helper function to safely get Firestore instance
 * Throws an error if Firestore is not available
 */
export function getFirestoreOrThrow(): Firestore {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }
  return db as Firestore;
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
  return doc(firestore, path, ...pathSegments);
}

/**
 * Helper function to safely create a collection reference
 */
export function safeCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  const firestore = getFirestoreOrThrow();
  return collection(firestore, path, ...pathSegments);
}
