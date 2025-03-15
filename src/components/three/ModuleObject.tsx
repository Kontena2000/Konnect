import { useRef, useState } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { ConnectionPoint } from './ConnectionPoint';

interface ModuleObjectProps {
  module: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    type: string;
  };
  selected?: boolean;
  onClick?: () => void;
  onConnectPoint?: (moduleId: string, point: [number, number, number], type: string) => void;
}

export function ModuleObject({ module, selected, onClick, onConnectPoint }: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current && hovered && !selected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const connectionPoints: Array<{ position: [number, number, number]; type: 'power' | 'network' | 'cooling' }> = [
    { position: [0.5, 0, 0], type: 'power' },
    { position: [-0.5, 0, 0], type: 'network' },
    { position: [0, 0.5, 0], type: 'cooling' }
  ];

  return (
    <group
      position={module.position}
      rotation={module.rotation}
      scale={module.scale}
    >
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={selected ? '#ff9900' : hovered ? '#ff7700' : module.color}
          metalness={0.5}
          roughness={0.5}
          opacity={selected || hovered ? 0.8 : 1}
          transparent
        />
      </mesh>
      
      {selected && connectionPoints.map((point, index) => (
        <ConnectionPoint
          key={index}
          position={point.position}
          type={point.type}
          onConnect={(position, type) => onConnectPoint?.(module.id, position, type)}
          isValidTarget={true} // This will be updated based on active connection
          activeConnectionType={null} // This will be updated based on active connection
        />
      ))}
    </group>
  );
}