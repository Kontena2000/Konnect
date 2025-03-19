
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, BoxGeometry } from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";

interface ModuleObjectProps {
  module: Module;
  selected?: boolean;
  onClick?: (moduleId?: string) => void;
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
  transformMode = "translate",
  gridSnap = true,
  readOnly = false
}: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  // Create geometry with bottom at origin
  const geometry = useMemo(() => {
    const geo = new BoxGeometry(
      module.dimensions.length,
      module.dimensions.height,
      module.dimensions.width
    );
    // Center horizontally but keep bottom at origin
    geo.translate(0, module.dimensions.height / 2, 0);
    return geo;
  }, [module.dimensions]);

  // Calculate control position above object
  const controlsPosition = useMemo(() => 
    new Vector3(
      module.position[0],
      module.dimensions.height + 1.5,
      module.position[2]
    ),
  [module.position, module.dimensions.height]);

  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.toArray() as [number, number, number];
    const rotation = meshRef.current.rotation.toArray() as [number, number, number];
    const scale = meshRef.current.scale.toArray() as [number, number, number];
    
    onUpdate?.({
      position: [position[0], 0, position[2]], // Keep Y at 0
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
    onClick?.(module.id);
  }, [onClick, module.id]);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.nativeEvent) {
      event.nativeEvent.preventDefault();
    }
    onClick?.(undefined);
  }, [onClick]);

  const rotateLeft = useCallback(() => {
    if (!meshRef.current) return;
    const newRotation = meshRef.current.rotation.y - Math.PI/2;
    meshRef.current.rotation.y = newRotation;
    handleTransformChange();
  }, [handleTransformChange]);

  const rotateRight = useCallback(() => {
    if (!meshRef.current) return;
    const newRotation = meshRef.current.rotation.y + Math.PI/2;
    meshRef.current.rotation.y = newRotation;
    handleTransformChange();
  }, [handleTransformChange]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[module.position[0], 0, module.position[2]]} // Keep Y at 0
        rotation={module.rotation}
        scale={module.scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        castShadow
        receiveShadow
      >
        <primitive object={geometry} />
        <meshStandardMaterial
          color={module.color || "#888888"}
          transparent={hovered || selected}
          opacity={hovered || selected ? 0.8 : 1}
          wireframe={module.wireframe}
        />
      </mesh>
      
      {(selected || hovered) && !readOnly && (
        <Html
          position={controlsPosition}
          center
          style={{ 
            pointerEvents: "auto",
            transform: "translateY(-100%)",
            zIndex: 1000
          }}
        >
          <div className="bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1">
            <button 
              className="p-1 hover:bg-accent rounded"
              onClick={(e) => {
                e.stopPropagation();
                rotateLeft();
              }}
            >
              ⟲
            </button>
            <button 
              className="p-1 hover:bg-accent rounded"
              onClick={(e) => {
                e.stopPropagation();
                rotateRight();
              }}
            >
              ⟳
            </button>
            {onDelete && selected && (
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
      
      {selected && !readOnly && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={transformMode}
          onObjectChange={handleTransformChange}
          size={0.75}
          showX={true}
          showY={false} // Disable Y axis movement
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
