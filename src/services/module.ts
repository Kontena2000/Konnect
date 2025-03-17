
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
  writeBatch,
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
  async initializeBasicCategory(): Promise<void> {
    try {
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
      console.error("Error initializing categories:", error);
      throw error;
    }
  },

  async initializeDefaultModules(): Promise<void> {
    try {
      const modulesRef = collection(db, "modules");
      const snapshot = await getDocs(modulesRef);
      
      if (!snapshot.empty) {
        console.log("Modules already exist");
        return;
      }

      console.log("No modules found, initializing defaults...");
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      for (const defaultMod of defaultModules) {
        const moduleRef = doc(modulesRef, defaultMod.id);
        batch.set(moduleRef, {
          ...defaultMod,
          visibleInEditor: true,
          createdAt: now,
          updatedAt: now
        });
      }

      await batch.commit();
      console.log("Default modules initialized successfully");
    } catch (error) {
      console.error("Error initializing default modules:", error);
      throw error;
    }
  },

  async getAllModules(): Promise<Module[]> {
    try {
      console.log("Fetching all modules...");
      const modulesRef = collection(db, "modules");
      const snapshot = await getDocs(modulesRef);

      if (snapshot.empty) {
        console.log("No modules found, initializing...");
        await this.initializeDefaultModules();
        const retrySnapshot = await getDocs(modulesRef);
        const modules = retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Module[];
        console.log("Modules after initialization:", modules);
        return modules;
      }

      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Module[];
      console.log("Fetched modules:", modules);
      return modules;
    } catch (error) {
      console.error("Error fetching modules:", error);
      return defaultModules;
    }
  },

  async getCategories(): Promise<CategoryData[]> {
    try {
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
      return [
        { id: "basic", name: "Basic" },
        { id: "konnect", name: "Konnect Modules" },
        { id: "network", name: "Network" },
        { id: "piping", name: "Piping" },
        { id: "environment", name: "Environment" }
      ];
    }
  },

  async createCategory(data: { id: string; name: string }): Promise<void> {
    try {
      const categoryRef = doc(db, "categories", data.id);
      const now = new Date().toISOString();
      await setDoc(categoryRef, {
        ...data,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(db, "categories", id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  async createModule(data: Module): Promise<string> {
    try {
      const moduleRef = doc(db, "modules", data.id);
      const now = new Date().toISOString();
      await setDoc(moduleRef, {
        ...data,
        createdAt: now,
        updatedAt: now
      });
      return data.id;
    } catch (error) {
      console.error("Error creating module:", error);
      throw error;
    }
  },

  async updateModule(id: string, data: Partial<Module>): Promise<void> {
    try {
      const moduleRef = doc(db, "modules", id);
      await updateDoc(moduleRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating module:", error);
      throw error;
    }
  },

  async deleteModule(id: string): Promise<void> {
    try {
      const moduleRef = doc(db, "modules", id);
      await deleteDoc(moduleRef);
    } catch (error) {
      console.error("Error deleting module:", error);
      throw error;
    }
  }
};

export default moduleService;
