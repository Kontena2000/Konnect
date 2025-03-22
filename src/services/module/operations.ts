
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { ModuleData, ModuleError } from "./types";
import { validateModule, validateCategory } from "./validation";
import firebaseMonitor from '@/services/firebase-monitor';

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

  async updateModule(id: string, data: Partial<ModuleData>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'update',
        status: 'pending',
        timestamp: Date.now(),
        details: { id }
      });

      const moduleRef = doc(db, 'modules', id);
      await setDoc(moduleRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'update',
        status: 'success',
        timestamp: Date.now(),
        details: { id }
      });
    } catch (error) {
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'update',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async deleteModule(id: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'delete',
        status: 'pending',
        timestamp: Date.now(),
        details: { id }
      });

      const moduleRef = doc(db, 'modules', id);
      await deleteDoc(moduleRef);

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'delete',
        status: 'success',
        timestamp: Date.now(),
        details: { id }
      });
    } catch (error) {
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'delete',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};
