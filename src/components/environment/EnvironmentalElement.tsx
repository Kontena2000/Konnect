
import { useRef } from "react";
import { Mesh } from "three";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EnvironmentalElement as ElementType } from "@/services/environment";

interface EnvironmentalElementProps {
  element: ElementType;
  onClick?: () => void;
  selected?: boolean;
}

export function EnvironmentalElement({ element, onClick, selected }: EnvironmentalElementProps) {
  const meshRef = useRef<Mesh>(null);

  // For development, use a placeholder geometry until we have proper models
  return (
    <group
      position={element.position}
      rotation={element.rotation}
      scale={element.scale}
      onClick={onClick}
    >
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={selected ? "#ffd700" : "#4CAF50"}
          opacity={0.8}
          transparent
        />
      </mesh>
      {selected && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}
    </group>
  );
}
