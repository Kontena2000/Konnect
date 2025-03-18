
export type ConnectionType = "power" | "network" | "cooling" | "security" | "cat6a" | "water" | "gas";

export interface ConnectionPoint {
  position: [number, number, number];
  type: ConnectionType;
  moduleId?: string;
}

export interface Connection {
  id: string;
  name?: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  capacity?: number;
  currentLoad?: number;
  voltage?: string;
  networkType?: "ethernet" | "fiber" | "wifi";
  intermediatePoints?: [number, number, number][];
}

export interface ConnectionLineProps {
  connection: Connection;
  selected?: boolean;
}
