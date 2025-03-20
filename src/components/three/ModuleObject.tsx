import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, Box3, Euler, DoubleSide, Matrix4, Quaternion } from "three";
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

  // Handle transform changes with grid snapping
  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.clone();
    const rotation = meshRef.current.rotation.clone();
    
    if (gridSnap) {
      // Snap position to grid
      position.x = Math.round(position.x);
      position.z = Math.round(position.z);
      
      // Snap rotation to 90-degree increments
      rotation.y = Math.round(rotation.y / (Math.PI / 2)) * (Math.PI / 2);
      
      // Apply snapped values
      meshRef.current.position.copy(position);
      meshRef.current.rotation.copy(rotation);
    }
    
    // Check for collisions
    const box = new Box3().setFromObject(meshRef.current);
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

    // Move object up if collision detected
    if (collisions) {
      const highestY = modules
        .filter(m => m.id !== module.id)
        .reduce((max, m) => Math.max(max, m.position[1] + m.dimensions.height/2), 0);
      position.y = highestY + module.dimensions.height/2;
      meshRef.current.position.copy(position);
    }
    
    // Update module state
    onUpdate?.({
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
    });
  }, [readOnly, onUpdate, module.id, module.dimensions, modules, gridSnap]);

  // Calculate shadow position and rotation
  const shadowTransform = useMemo(() => {
    if (!meshRef.current) return { position: new Vector3(0, 0.01, 0), rotation: new Euler(-Math.PI/2, 0, 0) };
    
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const rotation = new Euler(-Math.PI/2, 0, 0);
    
    // Get world matrix and position
    meshRef.current.updateMatrixWorld();
    matrix.copy(meshRef.current.matrixWorld);
    position.setFromMatrixPosition(matrix);
    position.y = 0.01;
    
    // Get world rotation
    meshRef.current.getWorldQuaternion(quaternion);
    rotation.y = quaternion.y;
    
    return { position, rotation };
  }, []); // Remove unnecessary dependencies

  // Calculate floating controls position
  const controlsPosition = useMemo(() => {
    if (!meshRef.current) return new Vector3(0, 2, 0);
    
    const worldPos = meshRef.current.getWorldPosition(new Vector3());
    const box = new Box3().setFromObject(meshRef.current);
    const height = box.max.y - box.min.y;
    
    // Calculate offset based on camera angle
    const cameraDir = new Vector3();
    camera.getWorldDirection(cameraDir);
    const cameraAngle = Math.atan2(cameraDir.x, cameraDir.z);
    
    // Position controls above object and rotate with camera
    const offset = new Vector3(
      Math.sin(cameraAngle) * 2,
      height + 1,
      Math.cos(cameraAngle) * 2
    );
    
    return worldPos.add(offset);
  }, [camera]); // Only depend on camera changes

  // Event handlers
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.(); // Deselect on right-click
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

  // Update controls visibility
  useEffect(() => {
    setShowControls(selected);
  }, [selected]);

  // Initial position setup
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...module.position);
      meshRef.current.rotation.set(...module.rotation);
      meshRef.current.scale.set(...module.scale);
    }
  }, [module.position, module.rotation, module.scale]);

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

      {/* Shadow */}
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

      {/* Floating Controls */}
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
      
      {/* Transform Controls */}
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
      
      {/* Connection Points */}
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