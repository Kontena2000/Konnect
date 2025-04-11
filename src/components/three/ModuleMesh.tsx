import { useEffect, useRef, useMemo, useState } from "react";
import { Mesh, Vector3, Box3, MeshStandardMaterial, BoxGeometry } from "three";
import { ThreeEvent } from '@react-three/fiber';
import { Module } from "@/types/module";
import { EditorPreferences } from "@/services/editor-preferences";

interface ModuleMeshProps {
  module: Module;
  meshRef: React.RefObject<Mesh>;
  editorPreferences?: EditorPreferences | null;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
}

export function ModuleMesh({
  module,
  meshRef,
  editorPreferences,
  onClick,
  onContextMenu
}: ModuleMeshProps) {
  const [dimensions, setDimensions] = useState({
    width: module.dimensions?.width || 1,
    height: module.dimensions?.height || 1,
    depth: module.dimensions?.depth || 1
  });

  // Log dimensi modul untuk debugging
  useEffect(() => {
    console.log(`ModuleMesh for ${module.id} - dimensions:`, {
      fromModule: module.dimensions,
      used: dimensions
    });
  }, [module.id, module.dimensions, dimensions]);

  // Update dimensions when module changes
  useEffect(() => {
    setDimensions({
      width: module.dimensions?.width || 1,
      height: module.dimensions?.height || 1,
      depth: module.dimensions?.depth || 1
    });
  }, [module.dimensions]);

  // Calculate color based on state
  const color = useMemo(() => {
    return module.color || '#666666';
  }, [module.color]);

  // Calculate bounding box for the module
  const boundingBox = useMemo(() => {
    const box = new Box3();
    const size = new Vector3(dimensions.width, dimensions.height, dimensions.depth);
    box.setFromCenterAndSize(new Vector3(0, 0, 0), size);
    return box;
  }, [dimensions]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.updateMatrixWorld(true);
        }
      });
    }
  }, [meshRef]);

  return (
    <mesh
      ref={meshRef}
      position={[module.position[0], module.position[1], module.position[2]]}
      rotation={[module.rotation[0], module.rotation[1], module.rotation[2]]}
      scale={[module.scale[0], module.scale[1], module.scale[2]]}
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
      />
    </mesh>
  );
}