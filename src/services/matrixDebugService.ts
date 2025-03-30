import { checkFirebaseInitialization, withFirebaseErrorHandling } from "@/utils/firebaseDebug";
import { db, getFirestoreSafely } from "@/lib/firebase";
import { collection, getDocs, query, limit, where, orderBy } from "firebase/firestore";
import { initializeFirebaseSafely } from "@/services/firebase-init";

/**
 * Matrix Debug Service
 * 
 * This service provides debugging utilities specifically for the Matrix calculator
 * to help diagnose issues with Firebase and data access.
 */

export interface MatrixDebugInfo {
  firebaseInitialized: boolean;
  collections: {
    name: string;
    documentCount: number;
    sampleDocumentIds: string[];
  }[];
  errors: string[];
}

const matrixDebugService = {
  /**
   * Run a comprehensive diagnostic on the Matrix calculator's Firebase dependencies
   */
  async runDiagnostic(): Promise<MatrixDebugInfo> {
    const result: MatrixDebugInfo = {
      firebaseInitialized: false,
      collections: [],
      errors: []
    };
    
    try {
      // Check Firebase initialization
      result.firebaseInitialized = checkFirebaseInitialization();
      
      if (!result.firebaseInitialized) {
        result.errors.push("Firebase is not properly initialized");
        return result;
      }
      
      // Check access to key collections
      const collectionsToCheck = [
        "calculations",
        "users",
        "projects",
        "modules"
      ];
      
      for (const collectionName of collectionsToCheck) {
        try {
          const collectionInfo = await this.checkCollection(collectionName);
          result.collections.push(collectionInfo);
        } catch (error) {
          if (error instanceof Error) {
            result.errors.push(`Error checking collection ${collectionName}: ${error.message}`);
          } else {
            result.errors.push(`Unknown error checking collection ${collectionName}`);
          }
        }
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(`Diagnostic error: ${error.message}`);
      } else {
        result.errors.push("Unknown diagnostic error occurred");
      }
      return result;
    }
  },
  
  /**
   * Check a specific Firestore collection and return information about it
   */
  async checkCollection(collectionName: string) {
    return await withFirebaseErrorHandling(async () => {
      const collRef = collection(db, collectionName);
      const q = query(collRef, orderBy("createdAt", "desc"), limit(5));
      const snapshot = await getDocs(q);
      
      return {
        name: collectionName,
        documentCount: snapshot.size,
        sampleDocumentIds: snapshot.docs.map(doc => doc.id)
      };
    }, `Error checking collection ${collectionName}`);
  },
  
  /**
   * Test a specific calculation to verify data access
   */
  async testCalculation(calculationId: string) {
    return await withFirebaseErrorHandling(async () => {
      const calculationsRef = collection(db, "calculations");
      const q = query(calculationsRef, where("id", "==", calculationId), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { exists: false, data: null };
      }
      
      const doc = snapshot.docs[0];
      return {
        exists: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      };
    }, `Error testing calculation ${calculationId}`);
  }
};

export default matrixDebugService;