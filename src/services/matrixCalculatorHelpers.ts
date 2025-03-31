import { Firestore, DocumentReference, CollectionReference, doc, collection } from 'firebase/firestore';
import { getFirestoreSafely, ensureFirebaseInitializedAsync } from '@/lib/firebase';
import { calculatorDebug } from './calculatorDebug';

/**
 * Utility function to safely get Firestore with better error handling
 */
export function getMatrixFirestore(): Firestore {
  try {
    // First try to get the Firestore instance safely
    const safeDb = getFirestoreSafely();
    
    if (!safeDb) {
      console.error('[Matrix Calculator] Firestore is not initialized in getMatrixFirestore, attempting to initialize');
      calculatorDebug.error('Firestore is not initialized in getMatrixFirestore', 'Attempting to initialize');
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
    console.log('[Matrix Calculator] Ensuring Firebase is initialized in getMatrixFirestoreAsync');
    const initialized = await ensureFirebaseInitializedAsync();
    
    if (!initialized) {
      console.error('[Matrix Calculator] Firebase initialization failed in getMatrixFirestoreAsync');
      calculatorDebug.error('Firebase initialization failed in getMatrixFirestoreAsync');
      throw new Error('Firebase initialization failed');
    }
    
    const firestore = getFirestoreSafely();
    if (!firestore) {
      console.error('[Matrix Calculator] Firestore is still not available after initialization');
      calculatorDebug.error('Firestore is still not available after initialization');
      throw new Error('Firestore is still not available after initialization');
    }
    
    return firestore;
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
  const firestore = await getMatrixFirestoreAsync();
  return doc(firestore, path, ...pathSegments);
}

/**
 * Safely create a collection reference with async initialization
 * This is the preferred method for creating collection references in async contexts
 */
export async function matrixCollectionRefAsync(path: string, ...pathSegments: string[]): Promise<CollectionReference> {
  const firestore = await getMatrixFirestoreAsync();
  return collection(firestore, path, ...pathSegments);
}