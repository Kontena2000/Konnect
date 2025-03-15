
import { ConnectionType } from "./connection";

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: ModuleCategory;
  color: string;
  dimensions: {
    length: number;
    height: number;
    width: number;
  };
  connectionPoints?: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
}

export enum ModuleCategory {
  Container = "container",
  Power = "power",
  Cooling = "cooling",
  Network = "network",
  Security = "security",
  Storage = "storage",
  Konnect = "konnect"
}

export const moduleTemplates: ModuleTemplate[] = [
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
  },
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
];

export interface ModuleTemplateWithSpecs extends ModuleTemplate {
  connectionPoints?: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
}

export type ModuleTemplateArray = ModuleTemplate[];
