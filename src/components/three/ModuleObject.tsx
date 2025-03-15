
import { useRef, useState } from "react";
import { Instance, Instances } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { Module } from "@/services/layout";
import { ConnectionPoint } from "./ConnectionPoint";
import { TransformControls } from "@react-three/drei";

interface ModuleObjectProps {
  module: Module;
  selected?: boolean;
  onSelect?: () => void;
  onUpdate?: (updates: Partial<Module>) => void;
  onDelete?: () => void;
  transformMode?: "translate" | "rotate" | "scale";
  readOnly?: boolean;
  gridSnap?: boolean;
}

export function ModuleObject({
  module,
  selected = false,
  onSelect,
  onUpdate,
  onDelete,
  transformMode = "translate",
  readOnly = false,
  gridSnap = true
}: ModuleObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect?.();
  };

  const handleTransformChange = () => {
    if (!meshRef.current) return;

    const position = meshRef.current.position.toArray() as [number, number, number];
    const rotation = meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number];
    const scale = meshRef.current.scale.toArray() as [number, number, number];

    onUpdate?.({
      position,
      rotation,
      scale
    });
  };

  return (
    <group>
      {selected && !readOnly && (
        <TransformControls
          object={meshRef}
          mode={transformMode}
          onObjectChange={handleTransformChange}
          size={0.7}
          showX={true}
          showY={true}
          showZ={true}
          snapMode={gridSnap ? "grid" : "none"}
        />
      )}

      <mesh
        ref={meshRef}
        position={module.position}
        rotation={module.rotation}
        scale={module.scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry
          args={[
            module.dimensions.length,
            module.dimensions.height,
            module.dimensions.width
          ]}
        />
        <meshStandardMaterial
          color={module.color}
          opacity={hovered ? 0.8 : 1}
          transparent
        />
      </mesh>

      {module.connectionPoints?.map((point, index) => (
        <ConnectionPoint
          key={index}
          position={point.position}
          type={point.type}
          moduleId={module.id}
        />
      ))}
    </group>
  );
}
