
import { useRef, useState, useEffect, useCallback } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh } from "three";
import { useLoader, ThreeEvent } from "@react-three/fiber";
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
  readOnly = false
}: ModuleObjectProps) {
  const meshRef = useRef<Object3D>(null);
  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<[number, number, number]>([0, 0, 0]);

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

  const handleMouseEnter = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (!selected) {
      setShowControls(false);
    }
  }, [selected]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (readOnly) return;
    event.stopPropagation();
    // Instead of preventDefault, we'll use stopPropagation
    setShowContextMenu(true);
    setContextMenuPosition([0, module.dimensions.height, 0]);
  }, [readOnly, module.dimensions.height]);

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

  useEffect(() => {
    if (meshRef.current) {
      const newPosition = new Vector3(...module.position);
      if (!meshRef.current.position.equals(newPosition)) {
        meshRef.current.position.copy(newPosition);
      }
    }
  }, [module.position]);

  const commonProps = {
    ref: meshRef,
    position: module.position,
    rotation: module.rotation,
    scale: module.scale,
    onPointerOver: handleMouseEnter,
    onPointerOut: handleMouseLeave,
    onClick: handleClick,
    castShadow: module.castShadow !== false,
    receiveShadow: module.receiveShadow !== false
  };

  return (
    <group onContextMenu={handleContextMenu}>
      <ModelFallback 
        module={module} 
        {...commonProps} 
        transparent={hovered || selected} 
        opacity={hovered || selected ? 0.8 : 1} 
      />
      
      {showControls && !readOnly && (
        <Html position={[0, module.dimensions.height + 0.5, 0]}>
          <div className="bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1">
            <button 
              className="p-1 hover:bg-accent rounded"
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
              className="p-1 hover:bg-accent rounded"
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
                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded ml-2"
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
      
      {showContextMenu && !readOnly && (
        <Html position={contextMenuPosition}>
          <div className="bg-background/90 backdrop-blur-sm p-2 rounded shadow-lg">
            <div className="space-y-1">
              <button 
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  if (meshRef.current) {
                    meshRef.current.rotation.y -= Math.PI/2;
                    handleTransformChange();
                  }
                  setShowContextMenu(false);
                }}
              >
                <span>Rotate Left</span>
                <kbd className="ml-auto text-xs bg-muted px-1.5 rounded">⟲</kbd>
              </button>
              <button 
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  if (meshRef.current) {
                    meshRef.current.rotation.y += Math.PI/2;
                    handleTransformChange();
                  }
                  setShowContextMenu(false);
                }}
              >
                <span>Rotate Right</span>
                <kbd className="ml-auto text-xs bg-muted px-1.5 rounded">⟳</kbd>
              </button>
              {onDelete && (
                <button 
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowContextMenu(false);
                  }}
                >
                  <span>Delete</span>
                  <kbd className="ml-auto text-xs bg-muted px-1.5 rounded">Del</kbd>
                </button>
              )}
            </div>
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
