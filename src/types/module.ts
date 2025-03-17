
import { ConnectionType } from "./connection";

export enum ModuleCategory {
  Basic = "basic"
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
  };
  createdAt?: string;
  updatedAt?: string;
}

export const moduleTemplatesByCategory: Record<string, ModuleTemplate[]> = {
  basic: [
    {
      id: "basic-module",
      name: "Basic Module",
      description: "A simple module with basic dimensions",
      type: "basic",
      category: ModuleCategory.Basic,
      color: "#64748b",
      dimensions: {
        length: 1.0,
        width: 1.0,
        height: 1.0
      }
    }
  ]
};

export const moduleTemplates = Object.values(moduleTemplatesByCategory).flat();
