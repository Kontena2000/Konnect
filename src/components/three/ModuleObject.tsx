import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, Box3, Euler, DoubleSide, Matrix4, Quaternion } from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html, Billboard } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";
import gsap from "gsap";

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
  const transformRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(selected);
  const [animating, setAnimating] = useState(true);
  const { camera } = useThree();
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  // Handle keyboard events for Y-axis movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Drop-in animation
  useEffect(() => {
    if (animating && meshRef.current) {
      const startPos = new Vector3(
        module.position[0],
        module.position[1] + 5,
        module.position[2]
      );
      meshRef.current.position.copy(startPos);

      gsap.to(meshRef.current.position, {
        y: module.position[1],
        duration: 0.6,
        ease: 'bounce.out',
        onComplete: () => setAnimating(false)
      });
    }
  }, [animating, module.position]);

  // Handle transform changes
  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.clone();
    const rotation = meshRef.current.rotation.clone();
    
    // Only snap when not actively transforming
    if (gridSnap && !isShiftPressed && !isTransforming) {
      // Snap position to grid
      if (transformMode === 'translate') {
        position.x = Math.round(position.x);
        position.z = Math.round(position.z);
        
        // Only snap Y to ground level on initial placement
        if (!selected) {
          position.y = module.dimensions.height / 2;
        }
      }
      
      // Snap rotation to 90-degree increments
      if (transformMode === 'rotate') {
        const targetRotation = Math.round(rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        gsap.to(meshRef.current.rotation, {
          y: targetRotation,
          duration: 0.2,
          ease: 'power2.out'
        });
        rotation.y = targetRotation;
      }
    }
    
    // Check for collisions
    const box = new Box3().setFromObject(meshRef.current);
    let hasCollision = false;
    
    modules.forEach(otherModule => {
      if (otherModule.id === module.id) return;
      
      const otherBox = new Box3();
      const otherPos = new Vector3(...otherModule.position);
      const otherSize = new Vector3(
        otherModule.dimensions.length,
        otherModule.dimensions.height,
        otherModule.dimensions.width
      );
      otherBox.setFromCenterAndSize(otherPos, otherSize);
      
      if (box.intersectsBox(otherBox)) {
        hasCollision = true;
      }
    });
    
    // Only prevent movement if there's a collision
    if (!hasCollision) {
      meshRef.current.position.copy(position);
      meshRef.current.rotation.copy(rotation);
      
      onUpdate?.({
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
      });
    }
  }, [readOnly, onUpdate, module.id, module.dimensions, modules, gridSnap, isShiftPressed, selected, transformMode, isTransforming]);

  // Calculate shadow transform
  const shadowTransform = useMemo(() => {
    if (!meshRef.current) return { position: new Vector3(0, 0.01, 0), rotation: new Euler(-Math.PI/2, 0, 0) };
    
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const rotation = new Euler(-Math.PI/2, 0, 0);
    
    meshRef.current.updateWorldMatrix(true, false);
    matrix.copy(meshRef.current.matrixWorld);
    
    // Get world position for shadow
    position.setFromMatrixPosition(matrix);
    position.y = 0.01; // Keep shadow just above ground
    
    // Get world rotation for shadow
    meshRef.current.getWorldQuaternion(quaternion);
    rotation.y = meshRef.current.rotation.y; // Only use Y rotation for shadow
    
    return { position, rotation };
  }, []); // Empty dependency array - will update based on render cycles

  // Event handlers
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
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

  // Update controls visibility
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
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[
            meshRef.current ? meshRef.current.position.x : module.position[0],
            (meshRef.current ? meshRef.current.position.y : module.position[1]) + module.dimensions.height + 1.5, // Increased offset
            meshRef.current ? meshRef.current.position.z : module.position[2]
          ]}
        >
          <Html
            center
            style={{
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              transform: `scale(${camera.zoom < 1 ? 1 / camera.zoom : 1})`,
              opacity: hovered ? 1 : 0.8
            }}
          >
            <div className='bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1 select-none'>
              <button 
                className='p-1 hover:bg-accent rounded'
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
                className='p-1 hover:bg-accent rounded'
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
                  className='p-1 hover:bg-destructive hover:text-destructive-foreground rounded ml-2'
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
        </Billboard>
      )}
      
      {/* Transform Controls */}
      {selected && !readOnly && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={transformMode}
          onMouseDown={() => {
            setIsTransforming(true);
            onTransformStart?.();
          }}
          onMouseUp={() => {
            setIsTransforming(false);
            onTransformEnd?.();
            handleTransformChange();
          }}
          onChange={handleTransformChange}
          size={0.75}
          showX={true}
          showY={true}
          showZ={true}
          enabled={true}
          translationSnap={gridSnap && !isShiftPressed ? 1 : null}
          rotationSnap={gridSnap ? Math.PI / 4 : null}
          scaleSnap={gridSnap ? 0.25 : null}
          space='world'
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