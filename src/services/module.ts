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
import { Module, ModuleCategory, defaultModules } from "@/types/module";
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
      
      const canEdit = tokenResult.claims.role === 'admin' || tokenResult.claims.role === 'editor';
      console.log('User can edit:', canEdit, 'Role:', tokenResult.claims.role);
      
      return canEdit;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  },

  async initializeBasicCategory(): Promise<void> {
    try {
      if (!(await this.checkUserPermissions())) {
        throw new Error("Insufficient permissions");
      }

      console.log("Checking categories collection...");
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);
      
      if (!snapshot.empty) {
        console.log("Categories already exist");
        return;
      }

      console.log("No categories found, initializing...");
      const categories = [
        { id: "basic", name: "Basic" },
        { id: "konnect", name: "Konnect Modules" },
        { id: "network", name: "Network" },
        { id: "piping", name: "Piping" },
        { id: "environment", name: "Environment" }
      ];

      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const category of categories) {
        const categoryRef = doc(categoriesRef, category.id);
        batch.set(categoryRef, {
          ...category,
          createdAt: now,
          updatedAt: now
        });
      }

      await batch.commit();
      console.log("Categories initialized successfully");
    } catch (error) {
      const fbError = error as FirebaseError;
      console.error("Error initializing categories:", fbError);
      throw new Error(`Failed to initialize categories: ${fbError.message}`);
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
      const fbError = error as FirebaseError;
      console.error('Error fetching modules:', fbError);
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
      const fbError = error as FirebaseError;
      console.error("Error fetching categories:", fbError);
      return [];
    }
  },

  async createCategory(data: { id: string; name: string }): Promise<void> {
    try {
      firebaseMonitor.logOperation({
        type: 'category',
        action: 'create',
        status: 'pending',
        timestamp: Date.now(),
        details: data
      });

      const user = auth.currentUser;
      if (!user) {
        const error = 'No user logged in';
        firebaseMonitor.logOperation({
          type: 'category',
          action: 'create',
          status: 'error',
          timestamp: Date.now(),
          error,
          details: data
        });
        throw new Error(error);
      }

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      console.log('Creating category as user:', user.email, 'isRuud:', isRuud);
      
      if (!isRuud) {
        const tokenResult = await getIdTokenResult(user, true);
        console.log('User token claims:', tokenResult.claims);
        
        if (tokenResult.claims.role !== 'admin' && tokenResult.claims.role !== 'editor') {
          const error = 'Insufficient permissions';
          firebaseMonitor.logOperation({
            type: 'category',
            action: 'create',
            status: 'error',
            timestamp: Date.now(),
            error,
            details: { ...data, userRole: tokenResult.claims.role }
          });
          throw new Error(error);
        }
      }

      // Validate category data
      if (!data.id || !data.name || data.name.trim().length === 0) {
        const error = 'Invalid category data';
        firebaseMonitor.logOperation({
          type: 'category',
          action: 'create',
          status: 'error',
          timestamp: Date.now(),
          error,
          details: data
        });
        throw new Error(error);
      }

      console.log('Creating category:', data);
      const categoryRef = doc(db, 'categories', data.id);

      // Check if category already exists
      const existingCategory = await getDoc(categoryRef);
      if (existingCategory.exists()) {
        const error = 'Category already exists';
        firebaseMonitor.logOperation({
          type: 'category',
          action: 'create',
          status: 'error',
          timestamp: Date.now(),
          error,
          details: data
        });
        throw new Error(error);
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
        details: { ...data, userId: user.uid }
      });

      console.log('Category created successfully:', data.id);
    } catch (error) {
      console.error('Error creating category:', error);
      firebaseMonitor.logOperation({
        type: 'category',
        action: 'create',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: data
      });
      throw error;
    }
  },

  async createModule(data: Module): Promise<string> {
    try {
      if (!(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      if (!(await this.validateModuleData(data))) {
        throw new ModuleError('Invalid module data', 'VALIDATION_FAILED');
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

  async initializeDefaultModules(): Promise<void> {
    try {
      if (!(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      console.log('Initializing default modules...');
      const batch = writeBatch(db);
      const modulesRef = collection(db, 'modules');

      for (const defaultModule of defaultModules) {
        const moduleRef = doc(modulesRef, defaultModule.id);
        const now = new Date().toISOString();
        batch.set(moduleRef, {
          ...defaultModule,
          createdAt: now,
          updatedAt: now,
          visibleInEditor: true
        });
      }

      await batch.commit();
      console.log('Default modules initialized successfully');
    } catch (error) {
      console.error('Error initializing default modules:', error);
      throw new ModuleError('Failed to initialize default modules', 'INIT_FAILED', error);
    }
  },

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
    try {
      if (!(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      if (!(await this.validateModuleData({ ...data, id }))) {
        throw new ModuleError('Invalid module data', 'VALIDATION_FAILED');
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
        updatedAt: serverTimestamp()
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
      if (!(await this.checkUserPermissions())) {
        throw new ModuleError('Insufficient permissions', 'UNAUTHORIZED');
      }

      console.log('Deleting module:', id);
      const moduleRef = doc(db, 'modules', id);
      
      // Check if module exists
      const moduleSnap = await getDoc(moduleRef);
      if (!moduleSnap.exists()) {
        throw new ModuleError('Module not found', 'NOT_FOUND');
      }

      // Check if module is in use in any layouts
      const layoutsQuery = query(
        collection(db, 'layouts'),
        where('modules', 'array-contains', id)
      );
      const layoutsSnap = await getDocs(layoutsQuery);
      
      if (!layoutsSnap.empty) {
        throw new ModuleError(
          'Cannot delete module that is in use in layouts',
          'MODULE_IN_USE'
        );
      }

      await deleteDoc(moduleRef);
      console.log('Module deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting module:', error);
      if (error instanceof ModuleError) throw error;
      throw new ModuleError(
        'Failed to delete module',
        'DELETE_FAILED',
        error
      );
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      if (!(await this.checkUserPermissions())) {
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
      const fbError = error as FirebaseError;
      console.error('Error deleting category:', fbError);
      throw new Error(`Failed to delete category: ${fbError.message}`);
    }
  },

  async validateModuleData(data: Partial<Module>): Promise<boolean> {
    if (!data.name || data.name.trim().length === 0) return false;
    if (!data.category) return false;
    if (!data.dimensions || 
        data.dimensions.length <= 0 || 
        data.dimensions.width <= 0 || 
        data.dimensions.height <= 0) return false;
    return true;
  }
};

export default moduleService;