import { Firestore, DocumentReference, CollectionReference, doc, collection } from 'firebase/firestore';
import { getFirestoreSafely, ensureFirebaseInitializedAsync, getFirestoreAsync } from '@/lib/firebase';
import { calculatorDebug } from './calculatorDebug';

/**
 * Utility function to safely get Firestore with better error handling
 */
export function getMatrixFirestore(): Firestore {
  try {
    // First try to get the Firestore instance safely
    const safeDb = getFirestoreSafely();
    
    if (!safeDb) {
      console.error('[Matrix Calculator] Firestore is not initialized in getMatrixFirestore');
      calculatorDebug.error('Firestore is not initialized in getMatrixFirestore');
      throw new Error('Firestore is not initialized');
    }
    
    return safeDb;
  } catch (error) {
    console.error('[Matrix Calculator] Error in getMatrixFirestore:', error);
    calculatorDebug.error('Error in getMatrixFirestore', error);
    throw new Error(`Failed to get Firestore: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Safe document reference creator for matrix calculator
 * This ensures Firebase is initialized before creating a document reference
 */
export function matrixDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  try {
    // Use getFirestoreSafely directly to avoid circular dependencies
    const firestore = getFirestoreSafely();
    if (!firestore) {
      console.error('[Matrix Calculator] Firestore is not initialized in matrixDocRef');
      calculatorDebug.error('Firestore is not initialized in matrixDocRef');
      throw new Error('Firestore is not initialized');
    }
    return doc(firestore, path, ...pathSegments);
  } catch (error) {
    console.error('[Matrix Calculator] Error in matrixDocRef:', error);
    calculatorDebug.error('Error in matrixDocRef', error);
    throw new Error(`Failed to create document reference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Safe collection reference creator for matrix calculator
 * This ensures Firebase is initialized before creating a collection reference
 */
export function matrixCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  try {
    // Use getFirestoreSafely directly to avoid circular dependencies
    const firestore = getFirestoreSafely();
    if (!firestore) {
      console.error('[Matrix Calculator] Firestore is not initialized in matrixCollectionRef');
      calculatorDebug.error('Firestore is not initialized in matrixCollectionRef');
      throw new Error('Firestore is not initialized');
    }
    return collection(firestore, path, ...pathSegments);
  } catch (error) {
    console.error('[Matrix Calculator] Error in matrixCollectionRef:', error);
    calculatorDebug.error('Error in matrixCollectionRef', error);
    throw new Error(`Failed to create collection reference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Async version of getMatrixFirestore that ensures Firebase is initialized
 * This is the preferred method for getting Firestore in async contexts
 */
export async function getMatrixFirestoreAsync(): Promise<Firestore> {
  try {
    // Use getFirestoreAsync directly from firebase.ts
    return await getFirestoreAsync();
  } catch (error) {
    console.error('[Matrix Calculator] Error in getMatrixFirestoreAsync:', error);
    calculatorDebug.error('Error in getMatrixFirestoreAsync', error);
    throw new Error(`Failed to get Firestore async: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Safely create a document reference with async initialization
 * This is the preferred method for creating document references in async contexts
 */
export async function matrixDocRefAsync(path: string, ...pathSegments: string[]): Promise<DocumentReference> {
  try {
    const firestore = await getFirestoreAsync();
    return doc(firestore, path, ...pathSegments);
  } catch (error) {
    console.error('[Matrix Calculator] Error in matrixDocRefAsync:', error);
    calculatorDebug.error('Error in matrixDocRefAsync', error);
    throw new Error(`Failed to create document reference async: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Safely create a collection reference with async initialization
 * This is the preferred method for creating collection references in async contexts
 */
export async function matrixCollectionRefAsync(path: string, ...pathSegments: string[]): Promise<CollectionReference> {
  try {
    const firestore = await getFirestoreAsync();
    return collection(firestore, path, ...pathSegments);
  } catch (error) {
    console.error('[Matrix Calculator] Error in matrixCollectionRefAsync:', error);
    calculatorDebug.error('Error in matrixCollectionRefAsync', error);
    throw new Error(`Failed to create collection reference async: ${error instanceof Error ? error.message : String(error)}`);
  }
}