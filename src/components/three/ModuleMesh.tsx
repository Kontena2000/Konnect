
import { useEffect } from "react";
import { Mesh, MeshStandardMaterial } from "three";
import * as THREE from "three";
import { Module } from "@/types/module";
import { EditorPreferences } from "@/services/editor-preferences";

interface ModuleMeshProps {
  module: Module;
  meshRef: React.RefObject<Mesh>;
  editorPreferences?: EditorPreferences | null;
  onClick?: (event: any) => void;
  onContextMenu?: (event: any) => void;
}

export function ModuleMesh({
  module,
  meshRef,
  editorPreferences,
  onClick,
  onContextMenu
}: ModuleMeshProps) {
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
      position={module.position}
      rotation={module.rotation}
      scale={module.scale}
      onClick={onClick}
      onContextMenu={onContextMenu}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[
        module.dimensions.length,
        module.dimensions.height,
        module.dimensions.width
      ]} />
      <meshStandardMaterial
        color={module.color || '#888888'}
        transparent={true}
        opacity={editorPreferences?.objects.transparency || 0.85}
        // wireframe={module.wireframe}
      />
    </mesh>
  );
}
