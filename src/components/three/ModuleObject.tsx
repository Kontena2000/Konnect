import { useRef, useState } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { ConnectionPoint } from './ConnectionPoint';
import { useTexture } from '@react-three/drei';

interface ModuleObjectProps {
  module: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    type: string;
    dimensions?: {
      length?: number;
      height?: number;
      width?: number;
    };
    connectionPoints?: Array<{ position: [number, number, number]; type: string }>;
  };
  selected?: boolean;
  onClick?: () => void;
  onConnectPoint?: (moduleId: string, point: [number, number, number], type: string) => void;
}

const CONTAINER_TEXTURES = {
  metal: 'https://images.unsplash.com/photo-1585202900225-6d3ac20a6962',
  rust: 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e'
};

export function ModuleObject({ module, selected, onClick, onConnectPoint }: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  
  // Load textures
  const metalTexture = useTexture(CONTAINER_TEXTURES.metal);
  metalTexture.wrapS = THREE.RepeatWrapping;
  metalTexture.wrapT = THREE.RepeatWrapping;
  metalTexture.repeat.set(2, 2);

  const getConnectionPointColor = (type: string) => {
    switch (type) {
      case 'power': return '#ff0000';
      case 'network': return '#00ff00';
      case 'cooling': return '#0000ff';
      default: return '#999999';
    }
  };

  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current && hovered && !selected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group
      position={module.position}
      rotation={module.rotation}
      scale={module.scale}
      onClick={onClick}
    >
      {/* Container body */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry 
          args={[
            module.dimensions?.length || 6.096,  // 20 feet
            module.dimensions?.height || 2.591,   // 8.5 feet
            module.dimensions?.width || 2.438     // 8 feet
          ]} 
        />
        <meshStandardMaterial 
          map={metalTexture}
          color={selected ? '#90cdf4' : '#ffffff'}
          roughness={0.7}
          metalness={0.3}
          envMapIntensity={1}
        />
      </mesh>

      {/* Door */}
      <mesh position={[module.dimensions?.length/2 - 0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 2.3, 2.2]} />
        <meshStandardMaterial color='#2d3748' />
      </mesh>

      {/* Connection points */}
      {module.connectionPoints?.map((point, index) => (
        <group key={index} position={point.position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onConnectPoint?.(module.id, point.position, point.type);
            }}
          >
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial 
              color={getConnectionPointColor(point.type)}
              emissive={getConnectionPointColor(point.type)}
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html position={[0, 0.2, 0]}>
            <div className='bg-background/80 px-2 py-1 rounded text-xs'>
              {point.type}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}