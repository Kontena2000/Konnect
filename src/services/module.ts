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
}

export const getDefaultSpecs = (): TechnicalSpecs => ({
  weight: {
    empty: 10,
    loaded: 15
  }
});

const moduleService = {
  async getAllModules(): Promise<ModuleTemplateWithSpecs[]> {
    try {
      console.log('Fetching modules...');
      const modulesRef = ref(realTimeDb, 'modules');
      const snapshot = await get(modulesRef);
      const dbModules = snapshot.exists() ? snapshot.val() : {};
      
      const defaultTemplates = moduleTemplates;
      const now = new Date().toISOString();
      
      const updates: Record<string, ModuleTemplateWithSpecs> = {};
      
      const mappedModules = defaultTemplates.map(template => {
        const existingModule = dbModules[template.id];
        const moduleData: ModuleTemplateWithSpecs = {
          ...template,
          technicalSpecs: existingModule?.technicalSpecs || getDefaultSpecs(),
          visibleInEditor: existingModule?.visibleInEditor ?? true,
          createdAt: existingModule?.createdAt || now,
          updatedAt: existingModule?.updatedAt || now
        };
        
        if (!existingModule) {
          updates[`modules/${template.id}`] = moduleData;
        }
        
        return moduleData;
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(realTimeDb), updates);
      }

      return mappedModules;
    } catch (error) {
      console.error('Error in getAllModules:', error);
      throw new Error('Failed to fetch modules');
    }
  },

  async updateModule(id: string, data: Partial<ModuleTemplateWithSpecs>): Promise<void> {
    try {
      const moduleRef = ref(realTimeDb, `modules/${id}`);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await update(moduleRef, updateData);
    } catch (error) {
      console.error("Error updating module:", error);
      throw new Error("Failed to update module");
    }
  },

  async createModule(data: ModuleTemplateWithSpecs): Promise<string> {
    try {
      if (!data.id) {
        throw new Error("Module ID is required");
      }
      const moduleRef = ref(realTimeDb, `modules/${data.id}`);
      const now = new Date().toISOString();
      const moduleData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };
      await set(moduleRef, moduleData);
      return data.id;
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