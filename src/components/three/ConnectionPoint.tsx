import { useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { ThreeEvent, useFrame } from "@react-three/fiber";

interface ConnectionPointProps {
  position: [number, number, number];
  type: "power" | "network" | "cooling";
  onConnect?: (position: [number, number, number], type: string) => void;
  onHover?: (position: [number, number, number] | null) => void;
  isValidTarget?: boolean;
  activeConnectionType?: string | null;
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
      return '#888888';
    }
    switch (type) {
      case "power": return "#ff0000";
      case "network": return "#00ff00";
      case "cooling": return "#0000ff";
      default: return "#ffffff";
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
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