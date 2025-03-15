
import { realTimeDb } from "@/lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";
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
      const modulesRef = ref(realTimeDb, "modules");
      const snapshot = await get(modulesRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const modules = snapshot.val();
      return Object.entries(modules).map(([id, data]) => ({
        id,
        ...(data as Omit<ModuleTemplateWithSpecs, "id">)
      }));
    } catch (error) {
      console.error("Error fetching modules:", error);
      throw new Error("Failed to fetch modules");
    }
  },

  async updateModule(id: string, data: Partial<ModuleTemplateWithSpecs>): Promise<void> {
    try {
      const moduleRef = ref(realTimeDb, `modules/${id}`);
      await update(moduleRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating module:", error);
      throw new Error("Failed to update module");
    }
  },

  async createModule(data: Omit<ModuleTemplateWithSpecs, "id">): Promise<string> {
    try {
      const moduleRef = ref(realTimeDb, `modules/${data.type}`);
      await set(moduleRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return data.type;
    } catch (error) {
      console.error("Error creating module:", error);
      throw new Error("Failed to create module");
    }
  },

  async deleteModule(id: string): Promise<void> {
    try {
      const moduleRef = ref(realTimeDb, `modules/${id}`);
      await remove(moduleRef);
    } catch (error) {
      console.error("Error deleting module:", error);
      throw new Error("Failed to delete module");
    }
  }
};

export default moduleService;
