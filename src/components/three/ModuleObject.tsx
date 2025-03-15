
import { useRef, useState } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture, Html } from "@react-three/drei";
import * as THREE from "three";

type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
type ConnectionType = PowerCableType | NetworkCableType;

interface ModuleObjectProps {
  module: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    type: string;
    isFoldable?: boolean;
    isOpen?: boolean;
    dimensions: {
      length: number;
      height: number;
      width: number;
      foldedHeight?: number;
    };
    connectionPoints?: Array<{
      position: [number, number, number];
      type: ConnectionType;
    }>;
  };
  selected?: boolean;
  onClick?: () => void;
  onConnectPoint?: (moduleId: string, point: [number, number, number], type: ConnectionType) => void;
  onToggleFold?: () => void;
}

const CONTAINER_TEXTURES = {
  metal: "https://images.unsplash.com/photo-1585202900225-6d3ac20a6962",
  rust: "https://images.unsplash.com/photo-1560343776-97e7d202ff0e",
  foldable: "https://images.unsplash.com/photo-1585202900225-6d3ac20a6962"
};

const getConnectionPointColor = (type: ConnectionType): string => {
  if (type.includes("3phase")) return "#ff0000";
  if (type.includes("ups")) return "#ff6b00";
  if (type.startsWith("cat")) return "#00ff00";
  if (["om3", "om4", "om5", "os2", "mtp-mpo"].includes(type)) return "#00ffff";
  return "#999999";
};

export function ModuleObject({ module, selected, onClick, onConnectPoint, onToggleFold }: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const texture = useTexture(module.isFoldable ? CONTAINER_TEXTURES.foldable : CONTAINER_TEXTURES.metal);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  useFrame((state, delta) => {
    if (meshRef.current && hovered && !selected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const containerDimensions = {
    length: module.dimensions?.length || 6.096,
    height: module.isFoldable && !module.isOpen ? 
      (module.dimensions?.foldedHeight || module.dimensions?.height * 0.2) : 
      module.dimensions?.height || 2.591,
    width: module.dimensions?.width || 2.438
  };

  return (
    <group
      position={module.position}
      rotation={module.rotation}
      scale={module.scale}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <mesh 
        ref={meshRef} 
        castShadow 
        receiveShadow
      >
        <boxGeometry 
          args={[
            containerDimensions.length,
            containerDimensions.height,
            containerDimensions.width
          ]} 
        />
        <meshStandardMaterial 
          map={texture}
          color={selected ? "#90cdf4" : module.color}
          roughness={0.7}
          metalness={0.3}
          envMapIntensity={1}
        />
      </mesh>

      {module.isFoldable && (
        <group position={[0, containerDimensions.height/2 + 0.1, 0]}>
          <mesh 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFold?.();
            }}
          >
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#ff6b00" />
          </mesh>
          <Html position={[0, 0.2, 0]}>
            <div className="bg-background/80 px-2 py-1 rounded text-xs">
              {module.isOpen ? "Fold" : "Unfold"}
            </div>
          </Html>
        </group>
      )}

      {module.connectionPoints?.map((point, index) => (
        <group key={index} position={point.position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onConnectPoint?.(module.id, point.position, point.type);
            }}
          >
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial 
              color={getConnectionPointColor(point.type)}
              emissive={getConnectionPointColor(point.type)}
              emissiveIntensity={0.5}
            />
          </mesh>
          <Html position={[0, 0.3, 0]}>
            <div className="bg-background/80 px-2 py-1 rounded text-xs whitespace-nowrap">
              {point.type}
            </div>
          </Html>
        </group>
      ))}

      {module.isFoldable && module.isOpen && (
        <mesh position={[0, -containerDimensions.height/2, 0]}>
          <boxGeometry args={[containerDimensions.length * 0.9, 0.1, containerDimensions.width * 0.9]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
      )}
    </group>
  );
}
