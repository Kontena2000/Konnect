import { db } from "@/lib/firebase";
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { Module, ModuleCategory, defaultModules } from "@/types/module";

interface CategoryData {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

const moduleService = {
  async getAllModules(): Promise<Module[]> {
    try {
      console.log("Fetching modules...");
      const modulesRef = collection(db, "modules");
      const snapshot = await getDocs(modulesRef);
      const dbModules = new Map(snapshot.docs.map(doc => [doc.id, doc.data() as Module]));
      
      const now = new Date().toISOString();
      const updates: Promise<void>[] = [];
      
      const mappedModules = defaultModules.map(template => {
        const existingModule = dbModules.get(template.id);
        const moduleData: Module = {
          ...template,
          visibleInEditor: existingModule?.visibleInEditor ?? true,
          createdAt: existingModule?.createdAt || now,
          updatedAt: existingModule?.updatedAt || now
        };
        
        if (!existingModule) {
          updates.push(
            setDoc(doc(db, "modules", template.id), moduleData)
          );
        }
        
        return moduleData;
      });

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      return mappedModules;
    } catch (error) {
      console.error("Error in getAllModules:", error);
      throw new Error("Failed to fetch modules");
    }
  },

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
    try {
      const moduleRef = doc(db, "modules", id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      await updateDoc(moduleRef, updateData);
    } catch (error) {
      console.error("Error updating module:", error);
      throw new Error("Failed to update module");
    }
  },

  async createModule(data: Module): Promise<string> {
    try {
      if (!data.id) {
        throw new Error("Module ID is required");
      }
      const moduleRef = doc(db, "modules", data.id);
      const now = new Date().toISOString();
      const moduleData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(moduleRef, moduleData);
      return data.id;
    } catch (error) {
      console.error("Error creating module:", error);
      throw new Error("Failed to create module");
    }
  },

  async deleteModule(id: string): Promise<void> {
    try {
      const moduleRef = doc(db, "modules", id);
      await deleteDoc(moduleRef);
    } catch (error) {
      console.error("Error deleting module:", error);
      throw new Error("Failed to delete module");
    }
  },

  async getCategories(): Promise<CategoryData[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryData));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  },

  async createCategory(name: string): Promise<string> {
    try {
      const categoriesRef = collection(db, 'categories');
      const id = name.toLowerCase().replace(/\s+/g, '-');
      const categoryRef = doc(categoriesRef, id);
      const now = new Date().toISOString();
      await setDoc(categoryRef, {
        name,
        createdAt: now,
        updatedAt: now
      });
      return id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }
};

export default moduleService;