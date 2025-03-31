import { 
  Firestore, 
  DocumentReference, 
  CollectionReference, 
  doc as firestoreDoc, 
  collection as firestoreCollection 
} from "firebase/firestore";
import { Auth } from "firebase/auth";

/**
 * Safely creates a document reference, handling null Firestore instances
 * @param firestore Firestore instance which might be null
 * @param path Document path
 * @param pathSegments Additional path segments
 * @returns DocumentReference or null if firestore is null
 */
export function safeDoc(
  firestore: Firestore | null, 
  path: string, 
  ...pathSegments: string[]
): DocumentReference | null {
  if (!firestore) {
    console.warn("Firestore is not initialized when trying to access document:", path);
    return null;
  }
  return firestoreDoc(firestore, path, ...pathSegments);
}

/**
 * Safely creates a collection reference, handling null Firestore instances
 * @param firestore Firestore instance which might be null
 * @param path Collection path
 * @param pathSegments Additional path segments
 * @returns CollectionReference or null if firestore is null
 */
export function safeCollection(
  firestore: Firestore | null,
  path: string,
  ...pathSegments: string[]
): CollectionReference | null {
  if (!firestore) {
    console.warn("Firestore is not initialized when trying to access collection:", path);
    return null;
  }
  return firestoreCollection(firestore, path, ...pathSegments);
}

/**
 * Ensures an Auth instance is not null, throwing an error if it is
 * @param auth Auth instance which might be null
 * @returns The non-null Auth instance
 * @throws Error if auth is null
 */
export function ensureAuth(auth: Auth | null): Auth {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  return auth;
}

/**
 * Ensures a Firestore instance is not null, throwing an error if it is
 * @param firestore Firestore instance which might be null
 * @returns The non-null Firestore instance
 * @throws Error if firestore is null
 */
export function ensureFirestore(firestore: Firestore | null): Firestore {
  if (!firestore) {
    throw new Error("Firestore is not initialized");
  }
  return firestore;
}

/**
 * Type guard to check if a value is not null or undefined
 * @param value Value to check
 * @returns True if value is not null or undefined
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
