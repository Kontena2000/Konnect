
import { useRef } from "react";
import { Sphere } from "@react-three/drei";
import { ConnectionType } from "@/types/connection";

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

  const getColorByType = (type: ConnectionType): string => {
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
    <Sphere
      ref={meshRef}
      position={position}
      args={[0.1, 16, 16]}
      onClick={onClick}
    >
      <meshStandardMaterial
        color={getColorByType(type)}
        emissive={getColorByType(type)}
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
}
