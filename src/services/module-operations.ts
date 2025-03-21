
import { db, auth } from "@/lib/firebase";
import { 
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { Module } from "@/types/module";
import firebaseMonitor from "./firebase-monitor";
import { ModuleError } from "./module";

export const moduleOperations = {
  async createModule(data: Module): Promise<string> {
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
        details: { moduleId: data.id, name: data.name }
      });

      const moduleRef = doc(db, 'modules', data.id);
      const moduleData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid
      };

      await setDoc(moduleRef, moduleData);

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'create',
        status: 'success',
        timestamp: Date.now(),
        details: { moduleId: data.id, name: data.name }
      });

      return data.id;
    } catch (error) {
      console.error('Error creating module:', error);
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

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
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
        details: { moduleId: id }
      });

      const moduleRef = doc(db, 'modules', id);
      await updateDoc(moduleRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'update',
        status: 'success',
        timestamp: Date.now(),
        details: { moduleId: id }
      });
    } catch (error) {
      console.error('Error updating module:', error);
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
        details: { moduleId: id }
      });

      const moduleRef = doc(db, 'modules', id);
      await deleteDoc(moduleRef);

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'delete',
        status: 'success',
        timestamp: Date.now(),
        details: { moduleId: id }
      });
    } catch (error) {
      console.error('Error deleting module:', error);
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
