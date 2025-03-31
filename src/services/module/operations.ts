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

export const moduleOperations = {
  async createModule(moduleData: ModuleData): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

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

      const moduleRef = doc(db, 'modules', moduleData.id);
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
      if (!auth) {
        throw new ModuleError('Auth is not initialized', 'AUTH_REQUIRED');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

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
      if (!auth) {
        throw new ModuleError('Auth is not initialized', 'AUTH_REQUIRED');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }
      
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
      if (!auth) {
        throw new ModuleError('Auth is not initialized', 'AUTH_REQUIRED');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }
      
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