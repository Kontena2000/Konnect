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
import { Module, ModuleCategory, defaultModules } from "@/types/module";

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

const moduleService = {
  async checkUserPermissions(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in");
        return false;
      }

      const token = await user.getIdTokenResult();
      console.log("User token claims:", token.claims);
      
      const canEdit = token.claims.role === 'admin' || token.claims.role === 'editor';
      console.log("User can edit:", canEdit);
      
      return canEdit;
    } catch (error) {
      console.error("Error checking permissions:", error);
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
      if (!(await this.checkUserPermissions())) {
        throw new Error("Insufficient permissions");
      }

      console.log("Creating category:", data);
      const categoryRef = doc(db, "categories", data.id);
      const now = new Date().toISOString();
      await setDoc(categoryRef, {
        ...data,
        createdAt: now,
        updatedAt: now
      });
      console.log("Category created successfully:", data.id);
    } catch (error) {
      const fbError = error as FirebaseError;
      console.error("Error creating category:", fbError);
      throw new Error(`Failed to create category: ${fbError.message}`);
    }
  },

  async createModule(data: Module): Promise<string> {
    try {
      if (!(await this.checkUserPermissions())) {
        throw new Error("Insufficient permissions");
      }

      console.log('Creating new module:', data);
      const moduleRef = doc(db, 'modules', data.id);
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
      const fbError = error as FirebaseError;
      console.error('Error creating module:', fbError);
      throw new Error(`Failed to create module: ${fbError.message}`);
    }
  },

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
    try {
      if (!(await this.checkUserPermissions())) {
        throw new Error("Insufficient permissions");
      }

      console.log("Updating module:", id, data);
      const moduleRef = doc(db, "modules", id);
      await updateDoc(moduleRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log("Module updated successfully:", id);
    } catch (error) {
      const fbError = error as FirebaseError;
      console.error("Error updating module:", fbError);
      throw new Error(`Failed to update module: ${fbError.message}`);
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
  }
};

export default moduleService;