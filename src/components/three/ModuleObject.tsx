
import { useRef, useState, useEffect, useCallback } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, BoxGeometry } from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";

interface ModuleObjectProps {
  module: Module;
  selected?: boolean;
  onClick?: () => void;
  onUpdate?: (updates: Partial<Module>) => void;
  onDelete?: () => void;
  transformMode?: "translate" | "rotate" | "scale";
  gridSnap?: boolean;
  readOnly?: boolean;
}

export function ModuleObject({
  module,
  selected = false,
  onClick,
  onUpdate,
  onDelete,
  transformMode = 'translate',
  gridSnap = true,
  readOnly = false
}: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.toArray() as [number, number, number];
    const rotation = meshRef.current.rotation.toArray() as [number, number, number];
    const scale = meshRef.current.scale.toArray() as [number, number, number];
    
    onUpdate?.({
      position,
      rotation,
      scale
    });
  }, [readOnly, onUpdate]);

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
  }, []);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  const rotateLeft = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= Math.PI/2;
      handleTransformChange();
    }
  }, [handleTransformChange]);

  const rotateRight = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += Math.PI/2;
      handleTransformChange();
    }
  }, [handleTransformChange]);

  useEffect(() => {
    if (!selected || readOnly) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (event.key === 'r' || event.key === 'R') {
        rotateRight();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        onDelete?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selected, readOnly, onDelete, rotateRight]);

  // Create geometry with bottom at origin
  const geometry = new BoxGeometry(
    module.dimensions.length,
    module.dimensions.height,
    module.dimensions.width
  );
  geometry.translate(0, module.dimensions.height / 2, 0);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[module.position[0], 0, module.position[2]]}
        rotation={module.rotation}
        scale={module.scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <primitive object={geometry} />
        <meshStandardMaterial
          color={module.color || '#888888'}
          transparent={hovered || selected}
          opacity={hovered || selected ? 0.8 : 1}
          wireframe={module.wireframe}
        />
      </mesh>
      
      {(selected || hovered) && !readOnly && (
        <Html
          position={[0, module.dimensions.height, 0]}
          center
          style={{ pointerEvents: 'auto' }}
        >
          <div className='bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1'>
            <button 
              className='p-1 hover:bg-accent rounded'
              onClick={(e) => {
                e.stopPropagation();
                rotateLeft();
              }}
            >
              ⟲
            </button>
            <button 
              className='p-1 hover:bg-accent rounded'
              onClick={(e) => {
                e.stopPropagation();
                rotateRight();
              }}
            >
              ⟳
            </button>
            {onDelete && selected && (
              <button 
                className='p-1 hover:bg-destructive hover:text-destructive-foreground rounded ml-2'
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                ✕
              </button>
            )}
          </div>
        </Html>
      )}
      
      {selected && !readOnly && meshRef.current && (
        <TransformControls
          object={meshRef.current}
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
