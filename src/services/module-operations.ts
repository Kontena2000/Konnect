import { getFirestoreSafely, getAuthSafely } from '@/lib/firebase';
import { 
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Module } from '@/types/module';
import firebaseMonitor from './firebase-monitor';
import { ModuleError } from './module';
import { waitForFirebaseBootstrap, withBootstrappedFirebase } from '@/utils/firebaseBootstrap';

export const moduleOperations = {
  async createModule(data: Module): Promise<string> {
    return withBootstrappedFirebase(async () => {
      const auth = getAuthSafely();
      const db = getFirestoreSafely();
      
      if (!auth || !db) {
        throw new ModuleError('Firebase not initialized', 'FIREBASE_ERROR');
      }
      
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
    }, data.id, 'Error creating module');
  },

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
    return withBootstrappedFirebase(async () => {
      const auth = getAuthSafely();
      const db = getFirestoreSafely();
      
      if (!auth || !db) {
        throw new ModuleError('Firebase not initialized', 'FIREBASE_ERROR');
      }
      
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
    }, undefined, `Error updating module ${id}`);
  },

  async deleteModule(id: string): Promise<void> {
    return withBootstrappedFirebase(async () => {
      const auth = getAuthSafely();
      const db = getFirestoreSafely();
      
      if (!auth || !db) {
        throw new ModuleError('Firebase not initialized', 'FIREBASE_ERROR');
      }
      
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
    }, undefined, `Error deleting module ${id}`);
  }
};