import { ConnectionType } from "./connection";

export enum ModuleCategory {
  Basic = 'basic',
  Container = 'container',
  Power = 'power',
  Cooling = 'cooling',
  Network = 'network',
  Security = "security",
  Storage = "storage",
  Konnect = "konnect",
  Environment = "environment"
}

export interface ModuleDimensions {
  length: number;
  width: number;
  height: number;
}

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: ModuleCategory;
  color: string;
  dimensions: ModuleDimensions;
  visibleInEditor?: boolean;
}

export interface ModuleTemplateWithSpecs extends ModuleTemplate {
  technicalSpecs: {
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
  };
}

export const moduleTemplatesByCategory: Record<string, ModuleTemplate[]> = {
  basic: [
    {
      id: 'basic-module',
      name: 'Basic Module',
      description: 'A simple module with basic dimensions',
      type: 'basic',
      category: ModuleCategory.Basic,
      color: '#64748b',
      dimensions: {
        length: 1.0,
        width: 1.0,
        height: 1.0
      }
    }
  ],
  container: [
    {
      id: "edge-container",
      name: "Edge Container",
      description: "Standard edge computing container",
      type: "container",
      category: ModuleCategory.Container,
      color: "#64748b",
      dimensions: {
        length: 6.1,
        width: 2.44,
        height: 2.59
      },
      connectionPoints: [
        { position: [3.05, 1.295, 0], type: "power" },
        { position: [-3.05, 1.295, 0], type: "network" },
        { position: [0, 2.59, 0], type: "cooling" }
      ]
    }
  ],
  power: [
    {
      id: "power-unit",
      name: "Power Distribution Unit",
      description: "Main power distribution unit",
      type: "power",
      category: ModuleCategory.Power,
      color: "#eab308",
      dimensions: {
        length: 1.2,
        width: 0.8,
        height: 2.0
      },
      connectionPoints: [
        { position: [0.6, 1.0, 0], type: "power" },
        { position: [-0.6, 1.0, 0], type: "power" }
      ]
    }
  ]
};

export const moduleTemplates = Object.values(moduleTemplatesByCategory).flat();