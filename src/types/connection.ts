
export type ConnectionType = "power" | "network" | "cooling" | "security";

export interface ConnectionPoint {
  position: [number, number, number];
  type: ConnectionType;
}
