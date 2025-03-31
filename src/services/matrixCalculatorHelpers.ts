
import { Firestore, DocumentReference, CollectionReference, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Utility function to safely get Firestore
 */
export function getMatrixFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db as Firestore;
}

/**
 * Safe document reference creator for matrix calculator
 */
export function matrixDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  return doc(getMatrixFirestore(), path, ...pathSegments);
}

/**
 * Safe collection reference creator for matrix calculator
 */
export function matrixCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  return collection(getMatrixFirestore(), path, ...pathSegments);
}
