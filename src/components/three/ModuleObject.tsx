
import { useRef, useState } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

interface ModuleObjectProps {
  module: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
  };
  onClick?: () => void;
}

export function ModuleObject({ module, onClick }: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={module.position}
      rotation={module.rotation}
      scale={module.scale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={hovered ? "#ff9900" : module.color} 
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  );
}
