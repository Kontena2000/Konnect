
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { ModuleTemplate } from "@/components/three/ModuleLibrary";

export interface TechnicalSpecs {
  weight: number;
  powerConsumption: {
    watts: number;
    kWh: number;
  };
  wireConfigurations: {
    type: string;
    gauge: string;
    length: number;
  }[];
}

export interface ModuleTemplateWithSpecs extends ModuleTemplate {
  technicalSpecs: TechnicalSpecs;
}

const moduleService = {
  async getAllModules(): Promise<ModuleTemplateWithSpecs[]> {
    try {
      const snapshot = await getDocs(collection(db, "modules"));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ModuleTemplateWithSpecs));
    } catch (error) {
      console.error("Error fetching modules:", error);
      throw new Error("Failed to fetch modules");
    }
  },

  async updateModule(id: string, data: Partial<ModuleTemplateWithSpecs>): Promise<void> {
    try {
      const moduleRef = doc(db, "modules", id);
      await updateDoc(moduleRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating module:", error);
      throw new Error("Failed to update module");
    }
  },

  async createModule(data: Omit<ModuleTemplateWithSpecs, "id">): Promise<string> {
    try {
      const moduleRef = await addDoc(collection(db, "modules"), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return moduleRef.id;
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
  }
};

export default moduleService;
