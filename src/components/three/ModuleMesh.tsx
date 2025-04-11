
import { useEffect, useRef, useMemo } from "react";
import { Mesh, Vector3, Box3 } from "three";
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from "three";
import { Module } from "@/types/module";
import { EditorPreferences } from "@/services/editor-preferences";

interface ModuleMeshProps {
  module: Module;
  meshRef?: React.RefObject<Mesh>;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
  hovered?: boolean;
  selected?: boolean;
  isColliding?: boolean;
  editorPreferences?: EditorPreferences | null;
}

export function ModuleMesh({
  module,
  meshRef,
  onClick,
  onContextMenu,
  hovered = false,
  selected = false,
  isColliding = false,
  editorPreferences
}: ModuleMeshProps) {
  const localRef = useRef<Mesh>(null);
  const ref = meshRef || localRef;

  // Scale down the module dimensions for better visualization
  const scaleFactor = 0.6; // Reduced from 0.7 to make modules even smaller

  // Calculate dimensions based on the module's dimensions
  const dimensions = useMemo(() => {
    return {
      width: module.dimensions.width * scaleFactor,
      height: module.dimensions.height * scaleFactor,
      depth: module.dimensions.depth * scaleFactor
    };
  }, [module.dimensions, scaleFactor]);

  // Determine color based on state
  const color = useMemo(() => {
    if (isColliding) return '#FF4040';
    if (selected) return '#4080FF';
    if (hovered) return '#60A0FF';
    return module.color || '#3B82F6';
  }, [isColliding, selected, hovered, module.color]);

  // Calculate bounding box for the module
  const boundingBox = useMemo(() => {
    const box = new Box3();
    const size = new Vector3(dimensions.width, dimensions.height, dimensions.depth);
    box.setFromCenterAndSize(new Vector3(0, 0, 0), size);
    return box;
  }, [dimensions]);

  useEffect(() => {
    if (ref.current) {
      ref.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.updateMatrixWorld(true);
        }
      });
    }
  }, [ref]);

  return (
    <mesh
      ref={ref}
      onClick={onClick}
      onContextMenu={onContextMenu}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
      <meshStandardMaterial 
        color={color} 
        transparent={true}
        opacity={editorPreferences?.objects.transparency || 0.85}
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
}
