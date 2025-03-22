
export type ElementType = "vegetation" | "infrastructure" | "utility" | "hardscape";

export interface EnvironmentalElement {
  id: string;
  type: ElementType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
}

export interface TerrainData {
  id: string;
  position: [number, number, number];
  dimensions: {
    width: number;
    depth: number;
  };
  color: string;
  roughness: number;
  metalness: number;
}

export const defaultTerrainData: TerrainData = {
  id: "default",
  position: [0, 0, 0],
  dimensions: {
    width: 100,
    depth: 100
  },
  color: "#7a7d7c",
  roughness: 0.8,
  metalness: 0.2
};
