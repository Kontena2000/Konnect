
export type ConnectionType = "power" | "network" | "cooling" | "security";

export interface ConnectionPoint {
  position: [number, number, number];
  type: ConnectionType;
  moduleId?: string;
}

export interface ConnectionLineProps {
  connection: {
    id: string;
    sourceModuleId: string;
    targetModuleId: string;
    sourcePoint: [number, number, number];
    targetPoint: [number, number, number];
    type: ConnectionType;
    intermediatePoints?: [number, number, number][];
  };
  selected?: boolean;
}
