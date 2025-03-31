import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  writeBatch,
  updateDoc,
  query,
  where,
  Firestore,
  DocumentReference
} from "firebase/firestore";
import { ModuleData, ModuleError } from "./types";
import { validateModule, validateCategory } from "./validation";
import firebaseMonitor from '@/services/firebase-monitor';
import { 
  getFirestoreOrThrow, 
  getAuthOrThrow, 
  getCurrentUserOrThrow,
  safeDocRef,
  safeCollectionRef
} from '@/services/firebaseHelpers';

// Helper function to safely use Firestore
function safeFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db as Firestore;
}

// Helper function to safely create document reference
function safeDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  return doc(safeFirestore(), path, ...pathSegments);
}

// Helper function to safely get auth user
function getAuthUser() {
  if (!auth) {
    throw new Error('Auth is not initialized');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export const moduleOperations = {
  async createModule(moduleData: ModuleData): Promise<void> {
    try {
      // Use the helper function to safely get the user
      const user = getCurrentUserOrThrow();

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'create',
        status: 'pending',
        timestamp: Date.now(),
        details: { name: moduleData.name }
      });

      if (!validateModule(moduleData)) {
        throw new ModuleError('Module validation failed', 'VALIDATION_FAILED');
      }

      const moduleRef = safeDocRef('modules', moduleData.id);
      await setDoc(moduleRef, {
        ...moduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid
      });

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'create',
        status: 'success',
        timestamp: Date.now(),
        details: { id: moduleData.id }
      });
    } catch (error) {
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'create',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getModuleById(moduleId: string): Promise<ModuleData> {
    try {
      // Use the helper function to safely get the user
      getCurrentUserOrThrow();

      const moduleRef = safeDocRef('modules', moduleId);
      const moduleDoc = await getDoc(moduleRef);
      
      if (!moduleDoc.exists()) {
        throw new ModuleError(`Module with ID ${moduleId} not found`, 'NOT_FOUND');
      }
      
      return {
        id: moduleDoc.id,
        ...moduleDoc.data()
      } as ModuleData;
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError(`Failed to get module with ID ${moduleId}`, 'FETCH_FAILED', error);
    }
  },
  
  async updateModule(moduleId: string, data: Partial<ModuleData>): Promise<void> {
    try {
      // Use the helper function to safely get the user
      getCurrentUserOrThrow();
      
      const moduleRef = safeDocRef('modules', moduleId);
      const moduleDoc = await getDoc(moduleRef);
      
      if (!moduleDoc.exists()) {
        throw new ModuleError(`Module with ID ${moduleId} not found`, 'NOT_FOUND');
      }
      
      await updateDoc(moduleRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError(`Failed to update module with ID ${moduleId}`, 'UPDATE_FAILED', error);
    }
  },
  
  async deleteModule(moduleId: string): Promise<void> {
    try {
      // Use the helper function to safely get the user
      getCurrentUserOrThrow();
      
      const moduleRef = safeDocRef('modules', moduleId);
      const moduleDoc = await getDoc(moduleRef);
      
      if (!moduleDoc.exists()) {
        throw new ModuleError(`Module with ID ${moduleId} not found`, 'NOT_FOUND');
      }
      
      await deleteDoc(moduleRef);
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError(`Failed to delete module with ID ${moduleId}`, 'DELETE_FAILED', error);
    }
  }
};