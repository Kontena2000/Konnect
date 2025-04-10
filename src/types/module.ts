
export interface ModuleDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ModuleConnectionPoint {
  id?: string;
  position: [number, number, number];
  type: string;
  side?: string;
  isInput?: boolean;
  isOutput?: boolean;
  capacity?: number;
  types?: string[];
}

export interface Module {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions: ModuleDimensions;
  color?: string;
  modelUrl?: string;
  connectionPoints?: ModuleConnectionPoint[];
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ModuleCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface ModuleTemplate {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  dimensions: ModuleDimensions;
  color?: string;
  modelUrl?: string;
  connectionPoints?: ModuleConnectionPoint[];
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Default module templates
export const DEFAULT_MODULE_TEMPLATES: ModuleTemplate[] = [
  {
    id: "rack-standard",
    name: "Standard Rack",
    type: "rack",
    category: "racks",
    description: "Standard 42U server rack",
    dimensions: { width: 0.6, height: 2.0, depth: 1.2 },
    color: "#8884d8",
    connectionPoints: [
      {
        position: [0.3, 0.5, 0],
        type: "power",
        side: "front",
        isInput: true,
        capacity: 10,
        types: ["power"]
      },
      {
        position: [-0.3, 0.5, 0],
        type: "cooling",
        side: "front",
        isInput: true,
        capacity: 5,
        types: ["cooling"]
      }
    ]
  },
  {
    id: "cooling-unit",
    name: "Cooling Unit",
    type: "cooling",
    category: "cooling",
    description: "Standard cooling unit",
    dimensions: { width: 1.0, height: 2.0, depth: 1.0 },
    color: "#82ca9d",
    connectionPoints: [
      {
        position: [0, 0.5, 0.5],
        type: "cooling",
        side: "front",
        isOutput: true,
        capacity: 20,
        types: ["cooling"]
      }
    ]
  },
  {
    id: "power-unit",
    name: "Power Distribution Unit",
    type: "power",
    category: "power",
    description: "Standard power distribution unit",
    dimensions: { width: 1.0, height: 1.5, depth: 0.8 },
    color: "#ffc658",
    connectionPoints: [
      {
        position: [0, 0.5, 0.4],
        type: "power",
        side: "front",
        isOutput: true,
        capacity: 40,
        types: ["power"]
      }
    ]
  },
  {
    id: "edge-container",
    name: "Edge Container",
    type: "container",
    category: "containers",
    description: "Edge computing container",
    dimensions: { width: 12.192, height: 2.896, depth: 2.438 },
    color: "#0088FE",
    connectionPoints: [
      {
        position: [6.096, 0, 1.219],
        type: "power",
        side: "east",
        isInput: true,
        types: ["power"]
      }
    ]
  }
];

// Get default module specifications
export function getDefaultSpecs(moduleType: string): ModuleTemplate | null {
  return DEFAULT_MODULE_TEMPLATES.find(template => template.id === moduleType) || null;
}

// Create a new module instance from a template
export function createModuleFromTemplate(
  template: ModuleTemplate,
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
  id?: string
): Module {
  return {
    id: id || `${template.id}-${Date.now()}`,
    name: template.name,
    type: template.type,
    category: template.category,
    description: template.description,
    position,
    rotation,
    scale,
    dimensions: { ...template.dimensions },
    color: template.color,
    modelUrl: template.modelUrl,
    connectionPoints: template.connectionPoints ? [...template.connectionPoints] : [],
    properties: template.properties ? { ...template.properties } : {},
    metadata: template.metadata ? { ...template.metadata } : {}
  };
}
