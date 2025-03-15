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
      // First get the templates from code
      const baseTemplates = Object.values(moduleTemplates).flat();
      
      // Then get the technical specs from Firebase
      const modulesRef = ref(realTimeDb, 'modules');
      const snapshot = await get(modulesRef);
      const dbSpecs = snapshot.exists() ? snapshot.val() : {};
      
      // Combine them
      return baseTemplates.map(template => ({
        ...template,
        technicalSpecs: dbSpecs[template.type]?.technicalSpecs || {
          weight: template.category === 'konnect' ? 2500 : 
                 template.category === 'power' ? 5 :
                 template.category === 'network' ? 0.5 :
                 template.category === 'cooling' ? 2 : 10,
          powerConsumption: {
            watts: template.category === 'konnect' ? 15000 : 0,
            kWh: template.category === 'konnect' ? 360 : 0
          },
          wireConfigurations: [{
            type: template.type,
            gauge: template.category === 'power' ? 'AWG 8' : 
                   template.category === 'network' ? template.type : 'N/A',
            length: template.category === 'konnect' ? 10 :
                    template.category === 'power' ? 5 :
                    template.category === 'network' ? 3 : 1
          }]
        }
      }));
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw new Error('Failed to fetch modules');
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