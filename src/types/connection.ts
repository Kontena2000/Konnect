
export type ConnectionType = "power" | "network" | "cooling" | "security" | "cat6a" | "water" | "gas";

export interface ConnectionPoint {
  position: [number, number, number];
  type: ConnectionType;
  moduleId?: string;
}

export interface Connection {
  id: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  capacity?: number;
  intermediatePoints?: [number, number, number][];
}

export interface ConnectionLineProps {
  connection: Connection;
  selected?: boolean;
}
