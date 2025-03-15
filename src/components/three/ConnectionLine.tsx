
import { Line } from "@react-three/drei";
import { ConnectionLineProps } from "@/types/connection";

export function ConnectionLine({ connection, selected = false }: ConnectionLineProps) {
  const points = connection.intermediatePoints 
    ? [connection.sourcePoint, ...connection.intermediatePoints, connection.targetPoint]
    : [connection.sourcePoint, connection.targetPoint];

  const getColorByType = (type: string): string => {
    switch (type) {
      case "power":
        return "#eab308";
      case "network":
        return "#3b82f6";
      case "cooling":
        return "#22c55e";
      case "security":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  return (
    <Line
      points={points}
      color={getColorByType(connection.type)}
      lineWidth={selected ? 2 : 1}
    />
  );
}
