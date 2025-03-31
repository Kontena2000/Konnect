import { 
  Firestore, 
  DocumentReference, 
  CollectionReference, 
  doc, 
  collection,
  DocumentData
} from "firebase/firestore";

/**
 * Helper function to safely create document references
 * This function handles the case where Firestore might be null
 */
export function safeDoc(
  firestore: Firestore | null, 
  path: string, 
  ...pathSegments: string[]
): DocumentReference<DocumentData> {
  if (!firestore) {
    throw new Error(`Firestore is not initialized when trying to access document: ${path}`);
  }
  return doc(firestore, path, ...pathSegments);
}

/**
 * Helper function to safely create collection references
 * This function handles the case where Firestore might be null
 */
export function safeCollection(
  firestore: Firestore | null,
  path: string,
  ...pathSegments: string[]
): CollectionReference<DocumentData> {
  if (!firestore) {
    throw new Error(`Firestore is not initialized when trying to access collection: ${path}`);
  }
  return collection(firestore, path, ...pathSegments);
}
