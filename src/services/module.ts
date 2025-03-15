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

const getDefaultSpecs = (category: ModuleCategory): TechnicalSpecs => ({
  weight: {
    empty: category === "konnect" ? 2500 : 
           category === "power" ? 5 :
           category === "network" ? 0.5 :
           category === "cooling" ? 2 : 10,
    loaded: category === "konnect" ? 2500 : 
           category === "power" ? 5 :
           category === "network" ? 0.5 :
           category === "cooling" ? 2 : 10
  },
  formFactor: {
    rackUnits: 1,
    containmentType: "standard"
  },
  accessClearance: {
    front: 1,
    rear: 1
  },
  powerConsumption: {
    typical: category === "konnect" ? 15000 : 0,
    maximum: category === "konnect" ? 18000 : 0,
    voltage: {
      min: 100,
      max: 240,
      phases: 1
    },
    connections: [{
      type: "AC",
      quantity: 1
    }],
    redundancy: {
      type: "N+1",
      configuration: "active"
    },
    upsCompatibility: [],
    monitoring: []
  },
  cooling: {
    heatOutput: {
      btu: 5000,
      kW: 1.5
    },
    requirements: {
      type: "air",
      capacity: 2000
    },
    airflow: {
      pattern: 'front-to-back',
      cfm: 100
    },
    temperature: {
      min: 10,
      max: 35,
      optimal: 22
    },
    redundancy: {
      type: "N+1",
      configuration: "active"
    },
    hotColdAisle: {
      compatible: true,
      configuration: "standard"
    }
  },
  connectivity: {
    networkPorts: [{
      type: "Ethernet",
      quantity: 4,
      speed: 1000
    }],
    bandwidth: {
      uplink: 1000,
      downlink: 1000
    },
    fiberConnections: [{
      type: "single-mode",
      quantity: 2
    }],
    copperConnections: [{
      type: "RJ45",
      quantity: 4
    }],
    redundancy: {
      type: "N+1",
      configuration: "active"
    },
    cableManagement: []
  },
  performance: {
    computing: {
      cores: 8,
      threads: 16,
      clockSpeed: 3.5,
      memory: 32
    },
    storage: {
      capacity: 1000,
      type: "SSD",
      iops: 100000
    },
    network: {
      throughput: 1000,
      latency: 10
    },
    benchmarks: [{
      name: "SPEC CPU",
      score: 20000
    }]
  },
  environmental: {
    noise: {
      idle: 30,
      load: 50
    },
    humidity: {
      min: 20,
      max: 80,
      optimal: 50
    },
    dustTolerance: "IP20",
    altitude: {
      max: 2000,
      derating: "none"
    },
    seismicRating: "Seismic Zone 2"
  },
  watts: category === "konnect" ? 15000 : 0,
  kWh: category === "konnect" ? 360 : 0,
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