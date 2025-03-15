
import { useRef, useState } from "react";
import { Mesh } from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";

type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
type ConnectionType = PowerCableType | NetworkCableType;

interface ConnectionPointProps {
  position: [number, number, number];
  type: ConnectionType;
  onConnect?: (position: [number, number, number], type: ConnectionType) => void;
  onHover?: (position: [number, number, number] | null) => void;
  isValidTarget?: boolean;
  activeConnectionType?: ConnectionType | null;
}

export function ConnectionPoint({ 
  position, 
  type,
  onConnect,
  onHover,
  isValidTarget = true,
  activeConnectionType = null
}: ConnectionPointProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state, delta) => {
    if (meshRef.current && (hovered || (activeConnectionType === type && isValidTarget))) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    setHovered(true);
    onHover?.(position);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  };

  const handleClick = () => {
    if (isValidTarget || !activeConnectionType) {
      onConnect?.(position, type);
    }
  };

  const getColor = () => {
    if (!isValidTarget && activeConnectionType) {
      return "#888888";
    }
    if (type.includes("3phase")) return "#ff0000";
    if (type.includes("ups")) return "#ff6b00";
    if (type.startsWith("cat")) return "#00ff00";
    if (["om3", "om4", "om5", "os2", "mtp-mpo"].includes(type)) return "#00ffff";
    return "#ffffff";
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial 
        color={getColor()} 
        emissive={getColor()}
        emissiveIntensity={hovered || (activeConnectionType === type && isValidTarget) ? 0.5 : 0.2}
        opacity={isValidTarget ? 1 : 0.5}
        transparent
      />
    </mesh>
  );
}
