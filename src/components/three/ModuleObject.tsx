import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, Box3, Euler, DoubleSide, Matrix4 } from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";

interface ModuleObjectProps {
  module: Module;
  modules?: Module[];
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

export function ModuleObject({
  module,
  modules = [],
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

  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || readOnly) return;
    
    // Get current object bounds
    const box = new Box3().setFromObject(meshRef.current);
    const size = box.getSize(new Vector3());
    
    // Check for collisions with other objects
    const collisions = modules.filter(m => m.id !== module.id).some(otherModule => {
      const otherBox = new Box3(
        new Vector3(
          otherModule.position[0] - otherModule.dimensions.length/2,
          otherModule.position[1] - otherModule.dimensions.height/2,
          otherModule.position[2] - otherModule.dimensions.width/2
        ),
        new Vector3(
          otherModule.position[0] + otherModule.dimensions.length/2,
          otherModule.position[1] + otherModule.dimensions.height/2,
          otherModule.position[2] + otherModule.dimensions.width/2
        )
      );
      return box.intersectsBox(otherBox);
    });

    // If collision detected, move object on top
    if (collisions) {
      const highestY = modules
        .filter(m => m.id !== module.id)
        .reduce((max, m) => Math.max(max, m.position[1] + m.dimensions.height/2), 0);
      meshRef.current.position.y = highestY + size.y/2;
    }

    // Snap to grid if enabled
    if (gridSnap) {
      meshRef.current.position.x = Math.round(meshRef.current.position.x);
      meshRef.current.position.z = Math.round(meshRef.current.position.z);
      meshRef.current.rotation.y = Math.round(meshRef.current.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
    }
    
    const position: [number, number, number] = [
      meshRef.current.position.x,
      meshRef.current.position.y,
      meshRef.current.position.z
    ];
    
    const rotation: [number, number, number] = [
      meshRef.current.rotation.x,
      meshRef.current.rotation.y,
      meshRef.current.rotation.z
    ];
    
    const scale: [number, number, number] = [
      meshRef.current.scale.x,
      meshRef.current.scale.y,
      meshRef.current.scale.z
    ];
    
    onUpdate?.({
      position,
      rotation,
      scale
    });
  }, [readOnly, onUpdate, module.id, modules, gridSnap]);

  // Update shadow transform calculation to match object rotation
  const shadowTransform = useMemo(() => {
    if (!meshRef.current) return { position: new Vector3(0, 0.01, 0), rotation: new Euler(-Math.PI/2, 0, 0) };
    
    const position = new Vector3(
      meshRef.current.position.x,
      0.01,
      meshRef.current.position.z
    );
    
    // Match object rotation for shadow
    const rotation = new Euler(
      -Math.PI/2, // Keep shadow flat on ground
      meshRef.current.rotation.y, // Match object Y rotation
      0
    );
    
    return { position, rotation };
  }, [meshRef.current?.position.x, meshRef.current?.position.z, meshRef.current?.rotation.y]);

  // Calculate controls position to follow camera rotation
  const controlsPosition = useMemo(() => {
    if (!meshRef.current) return new Vector3(0, 0, 0);
    
    const worldPosition = meshRef.current.getWorldPosition(new Vector3());
    const box = new Box3().setFromObject(meshRef.current);
    const height = box.max.y - box.min.y;
    
    // Get camera direction vector
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Calculate offset based on camera angle
    const offset = new Vector3(0, height + 1, 0);
    
    // Apply camera rotation to offset
    const cameraRotation = new Euler().setFromQuaternion(camera.quaternion);
    offset.applyEuler(new Euler(0, cameraRotation.y, 0));
    
    return worldPosition.add(offset);
  }, [camera, meshRef.current]);

  // Handle right-click deselection
  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.(); // Deselect on right-click
  }, [onClick]);

  // Initial position setup
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...module.position);
      meshRef.current.rotation.set(...module.rotation);
      meshRef.current.scale.set(...module.scale);
    }
  }, [module.position, module.rotation, module.scale]);

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
    setShowControls(selected);
  }, [selected]);

  return (
    <group>
      <mesh 
        ref={meshRef}
        position={module.position}
        rotation={module.rotation}
        scale={module.scale}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerOver={handleMouseEnter}
        onPointerOut={handleMouseLeave}
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
          transparent={hovered || selected}
          opacity={hovered || selected ? 0.8 : 1}
          wireframe={module.wireframe}
        />
      </mesh>

      {/* Shadow preview */}
      <mesh 
        position={shadowTransform.position}
        rotation={shadowTransform.rotation}
      >
        <planeGeometry args={[
          module.dimensions.length,
          module.dimensions.width
        ]} />
        <meshBasicMaterial 
          color="#000000"
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>

      {(showControls || hovered || selected) && !readOnly && (
        <Html
          position={controlsPosition}
          center
          transform
          style={{
            transition: 'all 0.2s ease',
            pointerEvents: 'auto'
          }}
        >
          <div className="bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1 select-none">
            <button 
              className="p-1 hover:bg-accent rounded"
              onClick={(e: React.MouseEvent) => {
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
              onClick={(e: React.MouseEvent) => {
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
                onClick={(e: React.MouseEvent) => {
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
          onMouseDown={onTransformStart}
          onMouseUp={() => {
            onTransformEnd?.();
            handleTransformChange();
          }}
          onChange={handleTransformChange}
          size={0.75}
          showX={true}
          showY={true}
          showZ={true}
          enabled={true}
          translationSnap={gridSnap ? 1 : null}
          rotationSnap={gridSnap ? Math.PI / 4 : null}
          scaleSnap={gridSnap ? 0.25 : null}
          space="world"
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