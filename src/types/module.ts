
import { ConnectionPoint } from "./connection";

export enum ModuleCategory {
  Basic = "basic"
}

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
  color: string;
  dimensions: ModuleDimensions;
  visibleInEditor?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  connectionPoints?: ConnectionPoint[];
  createdAt?: string;
  updatedAt?: string;
}

export const defaultModules: Module[] = [
  {
    id: "basic-module",
    name: "Basic Module",
    description: "A simple module with basic dimensions",
    category: ModuleCategory.Basic,
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
  }
];
