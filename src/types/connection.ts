
export type ConnectionType = "power" | "water-supply" | "water-return";

export type ConnectionSide = "north" | "east" | "south" | "west";

export interface ConnectionPoint {
  id: string;
  moduleId: string;
  side: ConnectionSide;
  types: ConnectionType[];
  position: [number, number, number];
  isInput?: boolean;
  isOutput?: boolean;
}

export interface Connection {
  id: string;
  name?: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePointId: string;
  targetPointId: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  maxCapacity: number;
  currentFlow: number;
  voltage?: "230" | "400" | "480";
  path: [number, number, number][];
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
