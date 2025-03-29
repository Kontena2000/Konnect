import type * as THREE from "three";
import { useRef, useState } from "react";
import { Sphere, Html } from "@react-three/drei";
import { ConnectionType } from "@/types/connection";
import { useThree } from "@react-three/fiber";

interface ConnectionPointProps {
  position: [number, number, number];
  type: ConnectionType;
  moduleId: string;
  onClick?: () => void;
}

export function ConnectionPoint({
  position,
  type,
  moduleId,
  onClick
}: ConnectionPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

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

  const getTypeLabel = (type: ConnectionType): string => {
    switch (type) {
      case "power":
        return "Power Connection";
      case "network":
        return "Network Connection";
      case "cooling":
        return "Cooling Connection";
      case "water":
        return "Water Connection";
      case "gas":
        return "Gas Connection";
      case "security":
        return "Security Connection";
      default:
        return "Connection Point";
    }
  };

  return (
    <group>
      <Sphere
        ref={meshRef}
        position={position}
        args={[0.15, 16, 16]} // Increased size for better visibility
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={getColorByType(type)}
          emissive={getColorByType(type)}
          emissiveIntensity={hovered ? 1 : 0.5}
          transparent
          opacity={hovered ? 1 : 0.8}
        />
      </Sphere>

      {/* Outer glow effect */}
      <Sphere
        position={position}
        args={[0.2, 16, 16]}
        scale={hovered ? 1.2 : 1}
      >
        <meshBasicMaterial
          color={getColorByType(type)}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </Sphere>

      {/* Tooltip */}
      {hovered && (
        <Html
          position={[position[0], position[1] + 0.3, position[2]]}
          center
          style={{
            transform: `scale(${camera.zoom < 1 ? 1 / camera.zoom : 1})`,
          }}
        >
          <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap">
            {getTypeLabel(type)}
          </div>
        </Html>
      )}
    </group>
  );
}