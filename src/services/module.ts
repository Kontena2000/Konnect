
import { realTimeDb } from "@/lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";
import { ModuleTemplate, ModuleCategory, moduleTemplates, moduleTemplatesByCategory } from '@/types/module';

export interface ModuleTemplateWithSpecs extends ModuleTemplate {
  technicalSpecs: TechnicalSpecs;
  visibleInEditor?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TechnicalSpecs {
  weight: {
    empty: number;
    loaded: number;
  };
  formFactor: {
    rackUnits: number;
    containmentType: string;
  };
  powerConsumption: {
    typical: number;
    maximum: number;
  };
  cooling: {
    heatOutput: {
      btu: number;
      kW: number;
    };
  };
}

export const getDefaultSpecs = (category: ModuleCategory): TechnicalSpecs => ({
  weight: {
    empty: category === ModuleCategory.Konnect ? 2500 : 
           category === ModuleCategory.Power ? 5 :
           category === ModuleCategory.Network ? 0.5 :
           category === ModuleCategory.Cooling ? 2 : 10,
    loaded: category === ModuleCategory.Konnect ? 3000 : 
            category === ModuleCategory.Power ? 5 :
            category === ModuleCategory.Network ? 0.5 :
            category === ModuleCategory.Cooling ? 2 : 10
  },
  formFactor: {
    rackUnits: category === ModuleCategory.Konnect ? 42 : 1,
    containmentType: category === ModuleCategory.Konnect ? 'standard-rack' : 'component'
  },
  powerConsumption: {
    typical: category === ModuleCategory.Konnect ? 15000 : 100,
    maximum: category === ModuleCategory.Konnect ? 18000 : 150
  },
  cooling: {
    heatOutput: {
      btu: category === ModuleCategory.Konnect ? 51180 : 1000,
      kW: category === ModuleCategory.Konnect ? 15 : 0.3
    }
  }
});

const moduleService = {
  async getAllModules(): Promise<ModuleTemplateWithSpecs[]> {
    try {
      console.log('Fetching modules...');
      const modulesRef = ref(realTimeDb, 'modules');
      const snapshot = await get(modulesRef);
      const dbModules = snapshot.exists() ? snapshot.val() : {};
      
      // Get default templates and ensure they exist in the database
      const defaultTemplates = Object.values(moduleTemplatesByCategory).flat();
      const now = new Date().toISOString();
      
      // Create a batch update for all modules
      const updates: Record<string, any> = {};
      
      const mappedModules = defaultTemplates.map(template => {
        const existingModule = dbModules[template.id];
        const moduleData: ModuleTemplateWithSpecs = {
          ...template,
          technicalSpecs: existingModule?.technicalSpecs || getDefaultSpecs(template.category),
          visibleInEditor: existingModule?.visibleInEditor ?? true,
          createdAt: existingModule?.createdAt || now,
          updatedAt: existingModule?.updatedAt || now
        };
        
        // Add to batch update if module doesn't exist or needs updating
        if (!existingModule) {
          updates[`modules/${template.id}`] = moduleData;
        }
        
        return moduleData;
      });

      // Perform batch update if needed
      if (Object.keys(updates).length > 0) {
        await update(ref(realTimeDb), updates);
      }

      console.log('Modules loaded:', mappedModules.length);
      return mappedModules;
    } catch (error) {
      console.error('Error in getAllModules:', error);
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
      const now = new Date().toISOString();
      await set(moduleRef, {
        ...data,
        createdAt: now,
        updatedAt: now
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
