
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, BoxGeometry } from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";

interface ModuleObjectProps {
  module: Module;
  selected?: boolean;
  onClick?: (moduleId: string | null) => void;
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

  // Update geometry creation to position bottom at ground level
  const geometry = useMemo(() => {
    const geo = new BoxGeometry(
      module.dimensions.length,
      module.dimensions.height,
      module.dimensions.width
    );
    // Translate up by half height to keep bottom at ground level
    geo.translate(0, module.dimensions.height / 2, 0);
    return geo;
  }, [module.dimensions]);

  // Calculate control position to be centered above object
  const controlsPosition = useMemo(() => {
    return new Vector3(0, module.dimensions.height + 0.5, 0);
  }, [module.dimensions.height]);

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

  // Add right-click handler to deselect
  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.nativeEvent) {
      event.nativeEvent.preventDefault();
    }
    onClick?.(null);
  }, [onClick]);

  return (
    <group position={[module.position[0], 0, module.position[2]]}>
      <mesh
        ref={meshRef}
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
          color={module.color || '#888888'}
          transparent={hovered || selected}
          opacity={hovered || selected ? 0.8 : 1}
          wireframe={module.wireframe}
        />
      </mesh>
      
      {(selected || hovered) && !readOnly && (
        <group position={controlsPosition}>
          <Html
            center
            style={{ 
              pointerEvents: 'auto',
              transform: 'translateY(-100%)',
              zIndex: 1000
            }}
          >
            <div className='bg-background/80 backdrop-blur-sm p-2 rounded shadow flex gap-2'>
              <button 
                className='p-2 hover:bg-accent rounded'
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
                className='p-2 hover:bg-accent rounded'
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
              {onDelete && selected && (
                <button 
                  className='p-2 hover:bg-destructive hover:text-destructive-foreground rounded ml-2'
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
        </group>
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
