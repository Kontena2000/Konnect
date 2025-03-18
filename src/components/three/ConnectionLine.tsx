
import { Line, Html } from "@react-three/drei";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";

interface ConnectionLineProps {
  connection: Connection;
  selected?: boolean;
}

// Helper function to get color based on connection type
const getColorByType = (type: ConnectionType) => {
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
    default:
      return "#94a3b8"; // Slate
  }
};

export function ConnectionLine({ connection, selected = false }: ConnectionLineProps) {
  // Calculate utilization percentage
  const utilization = connection.currentLoad && connection.capacity 
    ? connection.currentLoad / connection.capacity 
    : 0;
  
  // Determine line color based on type and utilization
  const getLineColor = () => {
    const baseColor = getColorByType(connection.type);
    
    // If utilization is high, blend toward red
    if (utilization > 0.8) {
      return "#ef4444"; // Red for high utilization
    } else if (utilization > 0.6) {
      return "#f97316"; // Orange for medium-high utilization
    }
    
    return baseColor;
  };
  
  // Determine line width based on type and selection
  const getLineWidth = () => {
    const baseWidth = connection.type === "power" ? 2 : 1;
    return selected ? baseWidth * 1.5 : baseWidth;
  };
  
  // Get line style based on connection type
  const getDashed = () => {
    return connection.type === "network";
  };
  
  const points = connection.intermediatePoints
    ? [connection.sourcePoint, ...connection.intermediatePoints, connection.targetPoint]
    : [connection.sourcePoint, connection.targetPoint];
    
  return (
    <>
      <Line
        points={points}
        color={getLineColor()}
        lineWidth={getLineWidth()}
        dashed={getDashed()}
      />
      
      {/* Add capacity indicator if this is a power connection */}
      {connection.type === "power" && connection.capacity && (
        <Html position={points[Math.floor(points.length / 2)]}>
          <div className="bg-background/80 backdrop-blur-sm px-1 rounded text-xs">
            {connection.currentLoad || 0}/{connection.capacity} kW
          </div>
        </Html>
      )}
    </>
  );
}
