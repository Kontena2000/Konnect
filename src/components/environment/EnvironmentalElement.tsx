
import { useRef } from "react";
import { Mesh } from "three";
import { EnvironmentalElement as ElementType } from "@/services/environment";

export interface EnvironmentalElementProps {
  element: ElementType;
  selected?: boolean;
  onClick?: () => void;
}

export function EnvironmentalElement({ element, selected = false, onClick }: EnvironmentalElementProps) {
  const meshRef = useRef<Mesh>(null);

  const handleClick = () => {
    onClick?.();
  };

  // Default dimensions if not specified in properties
  const width = element.properties?.width || 1;
  const height = element.properties?.height || 1;
  const depth = element.properties?.depth || 1;

  return (
    <mesh
      ref={meshRef}
      position={element.position}
      rotation={element.rotation || [0, 0, 0]}
      scale={element.scale || [1, 1, 1]}
      onClick={handleClick}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={element.properties?.color || "#4b5563"}
        opacity={selected ? 0.9 : 0.8}
        transparent
        emissive={selected ? "#ffffff" : undefined}
        emissiveIntensity={selected ? 0.2 : 0}
      />
    </mesh>
  );
}
