
import { useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { ThreeEvent } from "@react-three/fiber";

interface ConnectionPointProps {
  position: [number, number, number];
  type: "power" | "network" | "cooling";
  onConnect?: (position: [number, number, number], type: string) => void;
  onHover?: (position: [number, number, number] | null) => void;
}

export function ConnectionPoint({ 
  position, 
  type,
  onConnect,
  onHover 
}: ConnectionPointProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    setHovered(true);
    onHover?.(position);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
  };

  const handleClick = () => {
    onConnect?.(position, type);
  };

  const getColor = () => {
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
        emissiveIntensity={hovered ? 0.5 : 0.2}
      />
    </mesh>
  );
}
