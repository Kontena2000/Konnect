import { Firestore, DocumentReference, CollectionReference, doc, collection } from 'firebase/firestore';
import { db, getFirestoreSafely, ensureFirebaseInitializedAsync } from '@/lib/firebase';

/**
 * Utility function to safely get Firestore
 */
export function getMatrixFirestore(): Firestore {
  // First try to get the Firestore instance safely
  const safeDb = getFirestoreSafely();
  
  if (!safeDb) {
    console.error('Firestore is not initialized in getMatrixFirestore, attempting to initialize');
    throw new Error('Firestore is not initialized');
  }
  
  return safeDb;
}

/**
 * Safe document reference creator for matrix calculator
 * This ensures Firebase is initialized before creating a document reference
 */
export function matrixDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  const firestore = getFirestoreSafely();
  if (!firestore) {
    console.error('Firestore is not initialized in matrixDocRef');
    throw new Error('Firestore is not initialized');
  }
  return doc(firestore, path, ...pathSegments);
}

/**
 * Safe collection reference creator for matrix calculator
 * This ensures Firebase is initialized before creating a collection reference
 */
export function matrixCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  const firestore = getFirestoreSafely();
  if (!firestore) {
    console.error('Firestore is not initialized in matrixCollectionRef');
    throw new Error('Firestore is not initialized');
  }
  return collection(firestore, path, ...pathSegments);
}

/**
 * Async version of getMatrixFirestore that ensures Firebase is initialized
 */
export async function getMatrixFirestoreAsync(): Promise<Firestore> {
  await ensureFirebaseInitializedAsync();
  const firestore = getFirestoreSafely();
  if (!firestore) {
    throw new Error('Firestore is still not available after initialization');
  }
  return firestore;
}