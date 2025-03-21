
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

interface CategoryData {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FirebaseError extends Error {
  code?: string;
  message: string;
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
        },
        {
          id: '208v-3phase',
          type: '208v-3phase',
          category: 'power',
          name: '208V 3-Phase',
          description: '208V Three Phase Power Cable',
          color: '#F1B73A',
          dimensions: { length: 0.1, width: 0.1, height: 0.1 },
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
      console.error('Error initializing default modules:', error);
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
      console.error('Error initializing basic category:', error);
      throw new ModuleError('Failed to initialize basic category', 'INIT_FAILED', error);
    }
  },

  async checkUserPermissions(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return false;
      }

      // Special case for Ruud - always has full access
      if (user.email === 'ruud@kontena.eu') {
        console.log('Ruud has full access');
        return true;
      }

      // Force token refresh to get latest claims
      const tokenResult = await getIdTokenResult(user, true);
      console.log('User token claims:', tokenResult.claims);
      
      const isAdmin = tokenResult.claims.role === 'admin';
      console.log('User is admin:', isAdmin);
      
      return isAdmin;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  },

  async getAllModules(): Promise<Module[]> {
    try {
      console.log('Checking user authentication...');
      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return [];
      }

      console.log('Fetching all modules...');
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
        console.log('Modules after initialization:', modules);
        return modules;
      }

      const modules = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          visibleInEditor: data.visibleInEditor ?? true,
          position: data.position || [0, 0, 0],
          rotation: data.rotation || [0, 0, 0],
          scale: data.scale || [1, 1, 1]
        };
      }) as Module[];
      
      console.log('Fetched modules:', modules);
      return modules;
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  },

  async getCategories(): Promise<CategoryData[]> {
    try {
      console.log("Checking user authentication...");
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in");
        return [];
      }

      console.log("Fetching categories...");
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);

      if (snapshot.empty) {
        console.log("No categories found, initializing...");
        await this.initializeBasicCategory();
        const retrySnapshot = await getDocs(categoriesRef);
        const categories = retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CategoryData[];
        console.log("Categories after initialization:", categories);
        return categories;
      }

      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CategoryData[];
      console.log("Fetched categories:", categories);
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  async createCategory(data: { id: string; name: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

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
      
      console.log('Category created successfully:', data.id);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async createModule(data: Module): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      if (!isRuud && !(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      console.log('Creating new module:', data);
      const moduleRef = doc(db, 'modules', data.id);
      
      // Check for duplicate ID
      const existingModule = await getDoc(moduleRef);
      if (existingModule.exists()) {
        throw new ModuleError('Module ID already exists', 'DUPLICATE_ID');
      }

      const now = new Date().toISOString();
      const moduleData = {
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        visibleInEditor: true
      };
      
      await setDoc(moduleRef, moduleData);
      console.log('Module created successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating module:', error);
      if (error instanceof ModuleError) throw error;
      throw new ModuleError('Failed to create module', 'CREATE_FAILED', error);
    }
  },

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      if (!isRuud && !(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      console.log('Updating module:', id, data);
      const moduleRef = doc(db, 'modules', id);
      
      // Check if module exists
      const moduleSnap = await getDoc(moduleRef);
      if (!moduleSnap.exists()) {
        throw new ModuleError('Module not found', 'NOT_FOUND');
      }

      await updateDoc(moduleRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      console.log('Module updated successfully:', id);
    } catch (error) {
      console.error('Error updating module:', error);
      if (error instanceof ModuleError) throw error;
      throw new ModuleError('Failed to update module', 'UPDATE_FAILED', error);
    }
  },

  async deleteModule(id: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ModuleError('Not authenticated', 'AUTH_REQUIRED');
      }

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      if (!isRuud && !(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      console.log('Deleting module:', id);
      const moduleRef = doc(db, 'modules', id);
      await deleteDoc(moduleRef);
      console.log('Module deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting module:', error);
      if (error instanceof ModuleError) throw error;
      throw new ModuleError('Failed to delete module', 'DELETE_FAILED', error);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      if (!isRuud && !(await this.checkUserPermissions())) {
        throw new Error('Insufficient permissions');
      }

      if (id === 'basic') {
        throw new Error('Cannot delete the basic category');
      }

      console.log('Deleting category:', id);
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
      console.log('Category deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};

export default moduleService;
