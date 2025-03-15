
import { realTimeDb } from "@/lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";
import { ModuleTemplate, ModuleCategory, moduleTemplates } from "@/components/three/ModuleLibrary";

export interface TechnicalSpecs {
  // Physical Specifications
  weight: {
    empty: number;
    loaded: number;
  };
  formFactor: {
    rackUnits: number;
    containmentType: string;
  };
  accessClearance: {
    front: number;
    rear: number;
  };

  // Power Characteristics
  powerConsumption: {
    typical: number;
    maximum: number;
    voltage: {
      min: number;
      max: number;
      phases: number;
    };
    connections: {
      type: string;
      quantity: number;
    }[];
    redundancy: {
      type: string;
      configuration: string;
    };
    upsCompatibility: string[];
    monitoring: string[];
  };

  // Cooling Properties
  cooling: {
    heatOutput: {
      btu: number;
      kW: number;
    };
    requirements: {
      type: string;
      capacity: number;
    };
    airflow: {
      pattern: 'front-to-back' | 'side-to-side';
      cfm: number;
    };
    temperature: {
      min: number;
      max: number;
      optimal: number;
    };
    redundancy: {
      type: string;
      configuration: string;
    };
    hotColdAisle: {
      compatible: boolean;
      configuration: string;
    };
  };

  // Connectivity
  connectivity: {
    networkPorts: {
      type: string;
      quantity: number;
      speed: number;
    }[];
    bandwidth: {
      uplink: number;
      downlink: number;
    };
    fiberConnections: {
      type: string;
      quantity: number;
    }[];
    copperConnections: {
      type: string;
      quantity: number;
    }[];
    redundancy: {
      type: string;
      configuration: string;
    };
    cableManagement: string[];
  };

  // Performance Metrics
  performance: {
    computing?: {
      cores: number;
      threads: number;
      clockSpeed: number;
      memory: number;
    };
    storage?: {
      capacity: number;
      type: string;
      iops: number;
    };
    network: {
      throughput: number;
      latency: number;
    };
    benchmarks: {
      name: string;
      score: number;
    }[];
  };

  // Environmental Factors
  environmental: {
    noise: {
      idle: number;
      load: number;
    };
    humidity: {
      min: number;
      max: number;
      optimal: number;
    };
    dustTolerance: string;
    altitude: {
      max: number;
      derating?: string;
    };
    seismicRating: string;
  };

  // Legacy support for existing code
  watts: number;
  kWh: number;
  wireConfigurations: {
    type: string;
    gauge: string;
    length: number;
  }[];
}

export interface ModuleTemplateWithSpecs extends ModuleTemplate {
  technicalSpecs: TechnicalSpecs;
}

export const getDefaultSpecs = (category: ModuleCategory): TechnicalSpecs => ({
  weight: {
    empty: category === 'konnect' ? 2500 : 
           category === 'power' ? 5 :
           category === 'network' ? 0.5 :
           category === 'cooling' ? 2 : 10,
    loaded: category === 'konnect' ? 3000 : 
           category === 'power' ? 5 :
           category === 'network' ? 0.5 :
           category === 'cooling' ? 2 : 10
  },
  formFactor: {
    rackUnits: category === 'konnect' ? 42 : 1,
    containmentType: category === 'konnect' ? 'standard-rack' : 'component'
  },
  accessClearance: {
    front: 1.2,
    rear: 1.0
  },
  powerConsumption: {
    typical: category === 'konnect' ? 15000 : 100,
    maximum: category === 'konnect' ? 18000 : 150,
    voltage: {
      min: 100,
      max: 240,
      phases: category === 'konnect' ? 3 : 1
    },
    connections: [{
      type: category === 'konnect' ? '208v-3phase' : 'standard',
      quantity: 2
    }],
    redundancy: {
      type: 'N+1',
      configuration: 'active-passive'
    },
    upsCompatibility: ['online', 'line-interactive'],
    monitoring: ['power', 'current', 'voltage']
  },
  cooling: {
    heatOutput: {
      btu: category === 'konnect' ? 51180 : 1000,
      kW: category === 'konnect' ? 15 : 0.3
    },
    requirements: {
      type: 'forced-air',
      capacity: category === 'konnect' ? 5000 : 500
    },
    airflow: {
      pattern: 'front-to-back',
      cfm: category === 'konnect' ? 1000 : 100
    },
    temperature: {
      min: 10,
      max: 35,
      optimal: 22
    },
    redundancy: {
      type: 'N+1',
      configuration: 'active'
    },
    hotColdAisle: {
      compatible: true,
      configuration: 'standard'
    }
  },
  connectivity: {
    networkPorts: [{
      type: 'ethernet',
      quantity: 4,
      speed: 10000
    }],
    bandwidth: {
      uplink: 40000,
      downlink: 40000
    },
    fiberConnections: [{
      type: 'single-mode',
      quantity: 2
    }],
    copperConnections: [{
      type: 'cat6a',
      quantity: 24
    }],
    redundancy: {
      type: 'N+1',
      configuration: 'active-active'
    },
    cableManagement: ['vertical', 'horizontal']
  },
  performance: {
    computing: {
      cores: 64,
      threads: 128,
      clockSpeed: 3.5,
      memory: 512
    },
    storage: {
      capacity: 10000,
      type: 'nvme',
      iops: 1000000
    },
    network: {
      throughput: 40000,
      latency: 0.1
    },
    benchmarks: [{
      name: 'SPECpower_ssj2008',
      score: 12000
    }]
  },
  environmental: {
    noise: {
      idle: 45,
      load: 65
    },
    humidity: {
      min: 20,
      max: 80,
      optimal: 45
    },
    dustTolerance: 'IP52',
    altitude: {
      max: 3000,
      derating: 'none'
    },
    seismicRating: 'Zone 4'
  },
  watts: category === 'konnect' ? 15000 : 100,
  kWh: category === 'konnect' ? 360 : 2.4,
  wireConfigurations: [{
    type: category,
    gauge: category === 'power' ? 'AWG 8' : 'N/A',
    length: category === 'konnect' ? 10 : 1
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
