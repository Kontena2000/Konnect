
import { useState } from "react";
import { Sphere, Html } from "@react-three/drei";
import { ConnectionType } from "@/types/connection";
import { Vector3 } from "three";
import { useThree } from "@react-three/fiber";

interface ConnectionPointProps {
  position: [number, number, number];
  type: ConnectionType;
  moduleId: string;
  onStartConnection?: (moduleId: string, point: Vector3, type: ConnectionType) => void;
  onEndConnection?: (moduleId: string, point: Vector3, type: ConnectionType) => void;
  isActive?: boolean;
  isConnected?: boolean;
  capacity?: number;
  currentLoad?: number;
}

const getColorByType = (type: ConnectionType): string => {
  switch (type) {
    case "power":
      return "#22c55e";
    case "network":
      return "#3b82f6";
    case "cooling":
      return "#06b6d4";
    case "water":
      return "#0ea5e9";
    case "gas":
      return "#f59e0b";
    case "security":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
};

export function ConnectionPoint({
  position,
  type,
  moduleId,
  onStartConnection,
  onEndConnection,
  isActive = false,
  isConnected = false,
  capacity = 0,
  currentLoad = 0
}: ConnectionPointProps) {
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onStartConnection?.(moduleId, new Vector3(...position), type);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    onEndConnection?.(moduleId, new Vector3(...position), type);
  };

  const baseColor = getColorByType(type);
  const color = isActive ? "#ffffff" : baseColor;
  const scale = hovered || isActive ? 1.5 : 1;
  const opacity = isConnected ? 1 : 0.5;

  const utilization = capacity > 0 ? (currentLoad / capacity) * 100 : 0;
  const utilizationColor = utilization > 80 ? "#ef4444" : utilization > 60 ? "#f97316" : baseColor;

  return (
    <group position={position}>
      {/* Glow effect */}
      <Sphere args={[0.15 * scale, 8, 8]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
        />
      </Sphere>

      {/* Main point */}
      <Sphere
        args={[0.1 * scale, 8, 8]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isActive ? 2 : 0.5}
        />
      </Sphere>

      {/* Capacity indicator */}
      {(hovered || isActive) && capacity > 0 && (
        <Html position={[0, 0.2, 0]}>
          <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: utilizationColor }} />
              <span>
                {currentLoad}/{capacity} {type === "network" ? "Gbps" : type === "power" ? "kW" : "m³/h"}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
