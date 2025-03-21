import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  FirestoreError
} from "firebase/firestore";
import { getIdTokenResult } from 'firebase/auth';
import { Module, ModuleCategory } from "@/types/module";
import firebaseMonitor from '@/services/firebase-monitor';
import { moduleOperations } from './module-operations';

interface CategoryData {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ModuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ModuleError';
    Object.setPrototypeOf(this, ModuleError.prototype);
  }
}

const moduleService = {
  async checkUserPermissions(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return false;
      }

      // Special case for Ruud - always has full access
      if (user.email === 'ruud@kontena.eu') {
        console.log('Admin user detected (ruud@kontena.eu), granting full access');
        return true;
      }

      try {
        const tokenResult = await getIdTokenResult(user, true);
        console.log('User token claims:', tokenResult.claims);
        return tokenResult.claims.role === 'admin';
      } catch (tokenError) {
        console.error('Error getting token claims:', tokenError);
        return false;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'delete',
        status: 'pending',
        timestamp: Date.now(),
        details: { categoryId, email: user.email }
      });

      // Check permissions
      const hasPermission = await this.checkUserPermissions();
      if (!hasPermission) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      const categoryRef = doc(db, 'categories', categoryId);
      await deleteDoc(categoryRef);

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'delete',
        status: 'success',
        timestamp: Date.now(),
        details: { categoryId, email: user.email }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      firebaseMonitor.logOperation({
        type: 'category',
        action: 'delete',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getAllModules(): Promise<Module[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return [];
      }

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'list',
        status: 'pending',
        timestamp: Date.now(),
        details: { userId: user.uid, email: user.email }
      });

      const modulesRef = collection(db, 'modules');
      const snapshot = await getDocs(modulesRef);

      if (snapshot.empty) {
        console.log('No modules found, initializing...');
        await this.initializeDefaultModules();
        const retrySnapshot = await getDocs(modulesRef);
        const modules = retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          visibleInEditor: doc.data().visibleInEditor ?? true,
          position: doc.data().position || [0, 0, 0],
          rotation: doc.data().rotation || [0, 0, 0],
          scale: doc.data().scale || [1, 1, 1]
        })) as Module[];

        firebaseMonitor.logOperation({
          type: 'module',
          action: 'list',
          status: 'success',
          timestamp: Date.now(),
          details: { userId: user.uid, email: user.email, count: modules.length }
        });

        return modules;
      }

      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visibleInEditor: doc.data().visibleInEditor ?? true,
        position: doc.data().position || [0, 0, 0],
        rotation: doc.data().rotation || [0, 0, 0],
        scale: doc.data().scale || [1, 1, 1]
      })) as Module[];

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'list',
        status: 'success',
        timestamp: Date.now(),
        details: { userId: user.uid, email: user.email, count: modules.length }
      });

      return modules;
    } catch (error) {
      console.error('Error fetching modules:', error);
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'list',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  },

  async createCategory(data: { id: string; name: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'create',
        status: 'pending',
        timestamp: Date.now(),
        details: { categoryId: data.id, name: data.name, email: user.email }
      });

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      if (!isRuud && !(await this.checkUserPermissions())) {
        throw new Error('Insufficient permissions');
      }

      console.log('Creating category:', data);
      const categoryRef = doc(db, 'categories', data.id);

      // Check if category already exists
      const existingCategory = await getDoc(categoryRef);
      if (existingCategory.exists()) {
        throw new Error('Category already exists');
      }

      const now = new Date().toISOString();
      await setDoc(categoryRef, {
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid
      });

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'create',
        status: 'success',
        timestamp: Date.now(),
        details: { categoryId: data.id, name: data.name, email: user.email }
      });

      console.log('Category created successfully:', data.id);
    } catch (error) {
      console.error('Error creating category:', error);
      firebaseMonitor.logOperation({
        type: 'category',
        action: 'create',
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
        console.error('No user logged in');
        return [];
      }

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'list',
        status: 'pending',
        timestamp: Date.now(),
        details: { email: user.email }
      });

      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);

      if (snapshot.empty) {
        console.log('No categories found, initializing basic category...');
        await this.initializeBasicCategory();
        const retrySnapshot = await getDocs(categoriesRef);
        const categories = retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CategoryData[];

        firebaseMonitor.logOperation({
          type: 'category',
          action: 'list',
          status: 'success',
          timestamp: Date.now(),
          details: { email: user.email, count: categories.length }
        });

        return categories;
      }

      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryData[];

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'list',
        status: 'success',
        timestamp: Date.now(),
        details: { email: user.email, count: categories.length }
      });

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      firebaseMonitor.logOperation({
        type: 'category',
        action: 'list',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
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
          category: 'konnect',
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

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'initialize',
        status: 'success',
        timestamp: Date.now(),
        details: { email: user.email, count: defaultModules.length }
      });
    } catch (error) {
      console.error('Error initializing default modules:', error);
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'initialize',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

      firebaseMonitor.logOperation({
        type: 'category',
        action: 'initialize',
        status: 'success',
        timestamp: Date.now(),
        details: { email: user.email }
      });
    } catch (error) {
      console.error('Error initializing basic category:', error);
      firebaseMonitor.logOperation({
        type: 'category',
        action: 'initialize',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new ModuleError('Failed to initialize basic category', 'INIT_FAILED', error);
    }
  },

  async duplicateModule(moduleId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'duplicate',
        status: 'pending',
        timestamp: Date.now(),
        details: { moduleId, email: user.email }
      });

      const moduleRef = doc(db, 'modules', moduleId);
      const moduleDoc = await getDoc(moduleRef);

      if (!moduleDoc.exists()) {
        throw new ModuleError('Module not found', 'NOT_FOUND');
      }

      const moduleData = moduleDoc.data() as Module;
      const newModuleId = `${moduleId}-copy-${Date.now()}`;
      const newModuleRef = doc(db, 'modules', newModuleId);

      await setDoc(newModuleRef, {
        ...moduleData,
        id: newModuleId,
        name: `${moduleData.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid
      });

      firebaseMonitor.logOperation({
        type: 'module',
        action: 'duplicate',
        status: 'success',
        timestamp: Date.now(),
        details: { originalId: moduleId, newId: newModuleId, email: user.email }
      });
    } catch (error) {
      console.error('Error duplicating module:', error);
      firebaseMonitor.logOperation({
        type: 'module',
        action: 'duplicate',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  createModule: moduleOperations.createModule,
  updateModule: moduleOperations.updateModule,
  deleteModule: moduleOperations.deleteModule,

  // Rest of the service methods remain unchanged...
};

export default moduleService;