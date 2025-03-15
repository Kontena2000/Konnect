
import { realTimeDb } from "@/lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";
import { ModuleTemplate, ModuleCategory, moduleTemplates } from "@/components/three/ModuleLibrary";

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

const getDefaultSpecs = (category: ModuleCategory): TechnicalSpecs => ({
  weight: category === "konnect" ? 2500 : 
         category === "power" ? 5 :
         category === "network" ? 0.5 :
         category === "cooling" ? 2 : 10,
  powerConsumption: {
    watts: category === "konnect" ? 15000 : 0,
    kWh: category === "konnect" ? 360 : 0
  },
  wireConfigurations: [{
    type: category,
    gauge: category === "power" ? "AWG 8" : 
           category === "network" ? category : "N/A",
    length: category === "konnect" ? 10 :
            category === "power" ? 5 :
            category === "network" ? 3 : 1
  }]
});

const moduleService = {
  async getAllModules(): Promise<ModuleTemplateWithSpecs[]> {
    try {
      const baseTemplates = Object.values(moduleTemplates).flat();
      const modulesRef = ref(realTimeDb, "modules");
      const snapshot = await get(modulesRef);
      const dbSpecs = snapshot.exists() ? snapshot.val() : {};
      
      return baseTemplates.map(template => ({
        ...template,
        technicalSpecs: dbSpecs[template.type]?.technicalSpecs || getDefaultSpecs(template.category)
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
