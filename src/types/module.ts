import { ConnectionType, ConnectionPoint } from "./connection";

export type ModuleCategory = string;

export interface ModuleDimensions {
  length: number;
  width: number;
  height: number;
}

export interface ModuleEnergyProperties {
  powerConsumption: number;
  powerProduction: number;
  powerStorage: number;
  powerStorageCurrent: number;
  coolingCapacity: number;
  coolingRequirement: number;
  powerFormula: string;
  coolingFormula: string;
}

export interface Module {
  id: string;
  type: string;
  name: string;
  description?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  connectionPoints?: {
    id: string;
    type: string;
    position: [number, number, number];
  }[];
  properties?: Record<string, any>;
  modelUrl?: string;
  category?: string;
  selected?: boolean;
}

export const defaultModules: Module[] = [
  {
    id: "basic-module",
    name: "Basic Module",
    description: "A simple module with basic dimensions",
    category: "basic",
    type: "basic",
    color: "#64748b",
    dimensions: {
      length: 1.0,
      width: 1.0,
      height: 1.0
    },
    visibleInEditor: true,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    connectionPoints: []
  },
  {
    id: "edge-container",
    name: "EDGE Container",
    description: "40-foot sea container for edge computing",
    category: "konnect",
    type: "container",
    color: "#2563eb",
    dimensions: {
      length: 12.192,
      width: 2.438,
      height: 2.896
    },
    visibleInEditor: true,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    connectionPoints: [
      {
        id: "edge-container-power-east",
        moduleId: "edge-container",
        side: "east",
        types: ["power"],
        position: [6.096, 0, 1.219],
        isInput: true,
        isOutput: false
      },
      {
        id: "edge-container-water-west",
        moduleId: "edge-container",
        side: "west",
        types: ["water-supply", "water-return"],
        position: [-6.096, 0, 1.219],
        isInput: true,
        isOutput: true
      }
    ],
    energy: {
      powerConsumption: 75,
      powerProduction: 0,
      powerStorage: 0,
      powerStorageCurrent: 0,
      coolingCapacity: 0,
      coolingRequirement: 50,
      powerFormula: "baseConsumption * loadFactor",
      coolingFormula: "heatOutput * coolingEfficiency"
    }
  }
];