
export enum ConnectionType {
  POWER = "power",
  DATA = "data",
  WATER = "water",
  GAS = "gas"
}

export interface Connection {
  id: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  color?: string;
}

export interface ConnectionPoint {
  id: string;
  position: [number, number, number];
  type: ConnectionType;
}
