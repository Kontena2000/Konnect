export type ConnectionType = "power" | "water-supply" | "water-return" | "network" | "cooling" | "water" | "gas" | "security";

export type ConnectionSide = "north" | "east" | "south" | "west";

export interface ConnectionPoint {
  id: string;
  moduleId?: string; // Updated to be optional
  side?: string; // Updated to be optional
  types?: string[]; // Updated to be optional
  position: [number, number, number];
  type?: string; // Updated to be a string
  isInput?: boolean;
  isOutput?: boolean;
}

export interface Connection {
  id: string;
  name?: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePointId?: string;
  targetPointId?: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  maxCapacity?: number;
  currentFlow?: number;
  capacity?: number; // Added for backward compatibility
  currentLoad?: number; // Added for backward compatibility
  voltage?: "230" | "400" | "480";
  networkType?: "ethernet" | "fiber" | "wifi";
  path?: [number, number, number][];
  intermediatePoints?: [number, number, number][];
}

export interface NetworkState {
  totalPowerProduction: number;
  totalPowerConsumption: number;
  totalPowerStorage: number;
  totalPowerStorageCurrent: number;
  isBalanced: boolean;
  overloadedConnectionIds: string[];
}

export interface ConnectionLineProps {
  connection: Connection;
  selected?: boolean;
}