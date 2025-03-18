import { ConnectionType } from "./connection";

export type ModuleCategory = string;

export interface ModuleDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  type: string;
  color: string;
  dimensions: ModuleDimensions;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visibleInEditor?: boolean;
  connectionPoints?: {
    position: [number, number, number];
    type: ConnectionType;
  }[];
  createdAt?: string;
  updatedAt?: string;
  modelUrl?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
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
    scale: [1, 1, 1]
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
        position: [6, 0, 0],
        type: "power"
      },
      {
        position: [-6, 0, 0],
        type: "network"
      }
    ]
  },
  {
    id: "oak-tree",
    name: "Oak Tree",
    description: "Large oak tree for environmental planning",
    category: "environment",
    type: "vegetation",
    color: "#166534",
    dimensions: {
      length: 5.0,
      width: 5.0,
      height: 8.0
    },
    visibleInEditor: true,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  },
  {
    id: "pine-tree",
    name: "Pine Tree",
    description: "Tall pine tree for environmental planning",
    category: "environment",
    type: "vegetation",
    color: "#15803d",
    dimensions: {
      length: 3.0,
      width: 3.0,
      height: 10.0
    },
    visibleInEditor: true,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  }
];