import { useEffect, useRef, useState } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";
import type { Mesh, Object3D } from "three";
import { Box3 } from 'three';
import { useThree } from '@react-three/fiber';

export interface ModuleObjectProps {
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
  const meshRef = useRef<Mesh>(null);
  const { scene } = useThree();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (meshRef.current) {
      const box = new Box3().setFromObject(meshRef.current);
      const size = box.getSize(box.max);
      
      // Update bounding box size
      if (onUpdate && (
        size.x !== module.dimensions.length ||
        size.y !== module.dimensions.height ||
        size.z !== module.dimensions.width
      )) {
        onUpdate({
          dimensions: {
            length: size.x,
            height: size.y,
            width: size.z
          }
        });
      }
    }
  }, [module, onUpdate]);

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
    if (meshRef.current && onUpdate) {
      const position = meshRef.current.position.toArray() as [number, number, number];
      const rotation = meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number];
      const scale = meshRef.current.scale.toArray() as [number, number, number];
      
      onUpdate({ position, rotation, scale });
    }
  };

  return (
    <group>
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
          transparent={selected}
          opacity={selected ? 0.8 : 1}
        />
      </mesh>

      {selected && !readOnly && (
        <TransformControls
          object={meshRef.current as Object3D}
          mode={transformMode}
          onObjectChange={handleTransformChange}
          size={0.75}
          showX={true}
          showY={true}
          showZ={true}
          enabled={true}
          translationSnap={gridSnap ? 1 : null}
          rotationSnap={gridSnap ? Math.PI / 4 : null}
        />
      )}

      {module.connectionPoints?.map((point, index) => (
        <ConnectionPoint
          key={`${module.id}-connection-${index}`}
          position={point.position}
          type={point.type}
          moduleId={module.id}
        />
      ))}
    </group>
  );
}