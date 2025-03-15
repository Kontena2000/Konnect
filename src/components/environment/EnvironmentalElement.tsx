
import { useRef } from "react";
import { Mesh } from "three";
import { EnvironmentalElement as ElementType } from "@/services/environment";

export interface EnvironmentalElementProps {
  element: ElementType;
  onSelect?: () => void;
}

export function EnvironmentalElement({ element, onSelect }: EnvironmentalElementProps) {
  const meshRef = useRef<Mesh>(null);

  const handleClick = () => {
    onSelect?.();
  };

  return (
    <mesh
      ref={meshRef}
      position={element.position}
      rotation={element.rotation || [0, 0, 0]}
      scale={element.scale || [1, 1, 1]}
      onClick={handleClick}
    >
      <boxGeometry args={[
        element.dimensions.width,
        element.dimensions.height,
        element.dimensions.depth
      ]} />
      <meshStandardMaterial
        color={element.color || "#4b5563"}
        opacity={0.8}
        transparent
      />
    </mesh>
  );
}
