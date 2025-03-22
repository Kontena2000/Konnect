
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where
} from "firebase/firestore";
import { getIdTokenResult } from 'firebase/auth';
import { ModuleData, CategoryData, ModuleError } from "./types";
import { moduleOperations } from "./operations";
import { validateCategory } from "./validation";
import firebaseMonitor from '@/services/firebase-monitor';

const moduleService = {
  ...moduleOperations,

  async checkUserPermissions(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return false;
      }

      if (user.email === 'ruud@kontena.eu') {
        console.log('Admin user detected (ruud@kontena.eu), granting full access');
        return true;
      }

      const tokenResult = await getIdTokenResult(user, true);
      return tokenResult.claims.role === 'admin';
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  },

  async getAllModules(): Promise<ModuleData[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'list',
        status: 'pending',
        timestamp: Date.now(),
        details: { userId: user.uid }
      });

      const modulesRef = collection(db, 'modules');
      const snapshot = await getDocs(modulesRef);

      if (snapshot.empty) {
        await this.initializeDefaultModules();
        const retrySnapshot = await getDocs(modulesRef);
        return retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          visibleInEditor: doc.data().visibleInEditor ?? true,
          position: doc.data().position || [0, 0, 0],
          rotation: doc.data().rotation || [0, 0, 0],
          scale: doc.data().scale || [1, 1, 1]
        })) as ModuleData[];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visibleInEditor: doc.data().visibleInEditor ?? true,
        position: doc.data().position || [0, 0, 0],
        rotation: doc.data().rotation || [0, 0, 0],
        scale: doc.data().scale || [1, 1, 1]
      })) as ModuleData[];
    } catch (error) {
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'list',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getCategories(): Promise<CategoryData[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);

      if (snapshot.empty) {
        await this.initializeBasicCategory();
        const retrySnapshot = await getDocs(categoriesRef);
        return retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CategoryData[];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryData[];
    } catch (error) {
      throw new ModuleError('Failed to fetch categories', 'FETCH_FAILED', error);
    }
  },

  async createCategory(data: { id: string; name: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      if (!validateCategory(data.id, data.name)) {
        throw new ModuleError('Category validation failed', 'VALIDATION_FAILED');
      }

      const hasPermission = await this.checkUserPermissions();
      if (!hasPermission) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      const categoryRef = doc(db, 'categories', data.id);
      const existingCategory = await getDoc(categoryRef);
      if (existingCategory.exists()) {
        throw new ModuleError('Category already exists', 'ALREADY_EXISTS');
      }

      await setDoc(categoryRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid
      });
    } catch (error) {
      throw new ModuleError('Failed to create category', 'CREATE_FAILED', error);
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      const hasPermission = await this.checkUserPermissions();
      if (!hasPermission) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      const categoryRef = doc(db, 'categories', categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      throw new ModuleError('Failed to delete category', 'DELETE_FAILED', error);
    }
  },

  async initializeDefaultModules(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      const defaultModules = [
        {
          id: 'edge-container',
          type: 'edge-container',
          category: 'basic',
          name: 'Edge Container',
          description: 'Standard Edge Computing Container',
          color: '#808080',
          dimensions: { length: 6.1, width: 2.9, height: 2.44 },
          visibleInEditor: true
        }
      ];

      const batch = writeBatch(db);
      for (const defaultItem of defaultModules) {
        const moduleRef = doc(db, 'modules', defaultItem.id);
        batch.set(moduleRef, {
          ...defaultItem,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.uid
        });
      }
      await batch.commit();
    } catch (error) {
      throw new ModuleError('Failed to initialize default modules', 'INIT_FAILED', error);
    }
  },

  async initializeBasicCategory(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      const categoryRef = doc(db, 'categories', 'basic');
      await setDoc(categoryRef, {
        id: 'basic',
        name: 'Basic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid
      });
    } catch (error) {
      throw new ModuleError('Failed to initialize basic category', 'INIT_FAILED', error);
    }
  }
};

export default moduleService;
export type { ModuleData, CategoryData, ModuleError };
