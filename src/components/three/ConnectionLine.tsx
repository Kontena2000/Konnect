
import { Line, Html } from "@react-three/drei";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import { useThree } from "@react-three/fiber";
import { useState } from "react";

interface ConnectionLineProps {
  connection: Connection;
  selected?: boolean;
}

const getColorByType = (type: ConnectionType): string => {
  switch (type) {
    case "power":
      return "#22c55e"; // Green
    case "network":
      return "#3b82f6"; // Blue
    case "cooling":
      return "#06b6d4"; // Cyan
    case "water":
      return "#0ea5e9"; // Light blue
    case "gas":
      return "#f59e0b"; // Amber
    case "security":
      return "#ef4444"; // Red
    default:
      return "#94a3b8"; // Slate
  }
};

export function ConnectionLine({ connection, selected = false }: ConnectionLineProps) {
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  // Calculate utilization percentage
  const utilization = connection.currentLoad && connection.capacity 
    ? connection.currentLoad / connection.capacity 
    : 0;

  // Get line color based on type and utilization
  const getLineColor = () => {
    const baseColor = getColorByType(connection.type);
    
    if (utilization > 0.8) {
      return "#ef4444"; // Red for high utilization
    } else if (utilization > 0.6) {
      return "#f97316"; // Orange for medium-high utilization
    }
    
    return baseColor;
  };

  // Line width scales with camera distance and selection state
  const getLineWidth = () => {
    const baseWidth = connection.type === "power" ? 3 : 2;
    const zoomScale = camera.zoom < 1 ? 1 / camera.zoom : 1;
    return (selected || hovered ? baseWidth * 1.5 : baseWidth) * zoomScale;
  };

  // Get line style based on connection type
  const getDashed = () => {
    return connection.type === "network";
  };

  const points = connection.intermediatePoints
    ? [connection.sourcePoint, ...connection.intermediatePoints, connection.targetPoint]
    : [connection.sourcePoint, connection.targetPoint];

  // Calculate midpoint for label positioning
  const midPoint = points[Math.floor(points.length / 2)];

  // Get appropriate unit based on connection type
  const getUnit = () => {
    switch (connection.type) {
      case "power":
      case "cooling":
        return "kW";
      case "network":
        return "Gbps";
      case "water":
      case "gas":
        return "m³/h";
      default:
        return "";
    }
  };

  return (
    <group>
      {/* Glow effect line */}
      <Line
        points={points}
        color={getLineColor()}
        lineWidth={getLineWidth() * 2}
        transparent
        opacity={0.2}
        dashed={false}
      />

      {/* Main line */}
      <Line
        points={points}
        color={getLineColor()}
        lineWidth={getLineWidth()}
        dashed={getDashed()}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {/* Capacity indicator */}
      {connection.capacity && (
        <Html position={midPoint}>
          <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getLineColor() }} />
              <span>
                {connection.currentLoad || 0}/{connection.capacity} {getUnit()}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
