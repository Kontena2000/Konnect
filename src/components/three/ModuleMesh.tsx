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
  // Pastikan dimensi modul valid
  const validDimensions = useMemo(() => ({
    width: module.dimensions?.width || 1,
    height: module.dimensions?.height || 1,
    depth: module.dimensions?.depth || 1
  }), [module.dimensions]);

  // Log dimensi modul untuk debugging
  useEffect(() => {
    console.log(`ModuleMesh for ${module.id} - dimensions:`, {
      fromModule: module.dimensions,
      used: validDimensions
    });
  }, [module.id, module.dimensions, validDimensions]);

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
      <boxGeometry args={[validDimensions.width, validDimensions.height, validDimensions.depth]} />
      <meshStandardMaterial 
        color={module.color || '#666666'} 
        transparent={true}
        opacity={0.85}
      />
    </mesh>
  );
}