import { useRef, useState, useEffect, useCallback } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh } from "three";
import { useLoader, useThree, ThreeEvent } from "@react-three/fiber";
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
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}

const ModelLoader = ({ url }: { url: string }) => {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene.clone()} />;
};

const ModelFallback = ({ module, ...props }: { module: Module } & any) => (
  <mesh {...props}>
    <boxGeometry args={[module.dimensions.length, module.dimensions.height, module.dimensions.width]} />
    <meshStandardMaterial
      color={module.color || "#888888"}
      transparent={props.transparent}
      opacity={props.opacity}
      wireframe={module.wireframe}
    />
  </mesh>
);

export function ModuleObject({
  module,
  selected = false,
  onClick,
  onUpdate,
  onDelete,
  transformMode = 'translate',
  gridSnap = true,
  readOnly = false,
  onTransformStart,
  onTransformEnd
}: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(selected);
  const { camera } = useThree();

  useEffect(() => {
    setShowControls(selected);
  }, [selected]);

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

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (!selected) {
      setShowControls(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!selected || readOnly) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (event.key === 'r' || event.key === 'R') {
        if (meshRef.current) {
          meshRef.current.rotation.y += Math.PI/2;
          handleTransformChange();
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        onDelete?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selected, readOnly, onDelete, handleTransformChange]);

  // Ensure initial position is correct
  useEffect(() => {
    if (meshRef.current) {
      const position = [...module.position];
      position[1] = module.dimensions.height / 2; // Place on top of grid
      meshRef.current.position.set(...position);
      handleTransformChange();
    }
  }, [module.position, module.dimensions.height, handleTransformChange]);

  return (
    <group onClick={handleClick}>
      <mesh 
        ref={meshRef}
        position={[module.position[0], module.dimensions.height / 2, module.position[2]]}
        rotation={module.rotation}
        scale={module.scale}
        onPointerOver={handleMouseEnter}
        onPointerOut={handleMouseLeave}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[module.dimensions.length, module.dimensions.height, module.dimensions.width]} />
        <meshStandardMaterial
          color={module.color || '#888888'}
          transparent={hovered || selected}
          opacity={hovered || selected ? 0.8 : 1}
          wireframe={module.wireframe}
        />
      </mesh>

      {(showControls || hovered) && !readOnly && (
        <Html position={[0, module.dimensions.height + 0.5, 0]}>
          <div className='bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1'>
            <button 
              className='p-1 hover:bg-accent rounded'
              onClick={(e) => {
                e.stopPropagation();
                if (meshRef.current) {
                  meshRef.current.rotation.y -= Math.PI/2;
                  handleTransformChange();
                }
              }}
            >
              ⟲
            </button>
            <button 
              className='p-1 hover:bg-accent rounded'
              onClick={(e) => {
                e.stopPropagation();
                if (meshRef.current) {
                  meshRef.current.rotation.y += Math.PI/2;
                  handleTransformChange();
                }
              }}
            >
              ⟳
            </button>
            {onDelete && (
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
          onDragging={(dragging) => {
            if (dragging) {
              onTransformStart?.();
            } else {
              onTransformEnd?.();
            }
          }}
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