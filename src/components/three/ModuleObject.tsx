import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, Box3, Euler, DoubleSide, Matrix4, Quaternion, Color } from "three";
import * as THREE from "three";
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

interface ShadowTransform {
  position: Vector3;
  rotation: Euler;
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
  const [shadowTransform, setShadowTransform] = useState<ShadowTransform>({
    position: new Vector3(module.position[0], 0.001, module.position[2]),
    rotation: new Euler(-Math.PI/2, 0, 0)
  });

  // Memoize initial position for drop animation
  const initialPosition = useMemo(() => new Vector3(
    module.position[0],
    module.position[1] + 5,
    module.position[2]
  ), [module.position]);

  // Update shadow transform calculation
  const updateShadowTransform = useCallback(() => {
    if (!meshRef.current) return;
    
    const worldPosition = new Vector3();
    meshRef.current.getWorldPosition(worldPosition);
    worldPosition.y = 0.001; // Keep shadow just above ground
    
    const worldRotation = new Euler(
      -Math.PI/2, // Always flat on ground
      meshRef.current.rotation.y, // Match object rotation
      0
    );
    
    // Update shadow immediately
    meshRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.updateMatrixWorld(true);
      }
    });
    
    setShadowTransform({
      position: worldPosition,
      rotation: worldRotation
    });
  }, []);

  // Handle keyboard events
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

  // Enhanced drop-in animation
  useEffect(() => {
    if (animating && meshRef.current) {
      meshRef.current.position.copy(initialPosition);

      gsap.to(meshRef.current.position, {
        y: module.dimensions.height / 2,
        duration: 0.8,
        ease: 'bounce.out',
        onUpdate: updateShadowTransform,
        onComplete: () => {
          setAnimating(false);
          updateShadowTransform();
        }
      });
    }
  }, [animating, initialPosition, module.dimensions.height, updateShadowTransform]);

  // Enhanced collision detection
  const handleCollision = useCallback((hasCollision: boolean) => {
    if (!meshRef.current || !(meshRef.current.material instanceof MeshStandardMaterial)) return;

    gsap.to(meshRef.current.material, {
      emissive: new Color(hasCollision ? '#ff0000' : '#000000'),
      emissiveIntensity: hasCollision ? 0.5 : 0,
      opacity: hasCollision ? 0.7 : (selected ? 0.8 : 1),
      duration: hasCollision ? 0.2 : 0.3
    });
  }, [selected]);

  // Enhanced transform handling with improved collision detection
  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.clone();
    const rotation = meshRef.current.rotation.clone();
    
    // Ensure proper height positioning
    const minHeight = module.dimensions.height / 2;
    position.y = Math.max(position.y, minHeight);
    
    // Grid snapping with smooth transitions
    if (gridSnap && !isShiftPressed && !isTransforming) {
      if (transformMode === 'translate') {
        const snappedPosition = new Vector3(
          Math.round(position.x),
          position.y,
          Math.round(position.z)
        );
        
        gsap.to(meshRef.current.position, {
          x: snappedPosition.x,
          z: snappedPosition.z,
          duration: 0.2,
          ease: 'power2.out',
          onUpdate: updateShadowTransform
        });
        
        position.copy(snappedPosition);
      }
      
      if (transformMode === 'rotate') {
        const targetRotation = Math.round(rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        gsap.to(meshRef.current.rotation, {
          y: targetRotation,
          duration: 0.2,
          ease: 'power2.out',
          onUpdate: updateShadowTransform
        });
        rotation.y = targetRotation;
      }
    }
    
    // Create a bounding box for collision detection
    const box = new Box3().setFromObject(meshRef.current);
    let hasCollision = false;
    
    // Modified collision detection that allows for stacking and side connections
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
      
      // If boxes intersect, check if it's a valid connection
      if (box.intersectsBox(otherBox)) {
        // Get intersection volume
        const intersection = box.clone().intersect(otherBox);
        const intersectionSize = new Vector3();
        intersection.getSize(intersectionSize);
        
        // Get box sizes
        const boxSize = new Vector3();
        box.getSize(boxSize);
        const otherBoxSize = new Vector3();
        otherBox.getSize(otherBoxSize);
        
        // Calculate overlap in each dimension as a percentage of the smaller module
        const xOverlapPercent = intersectionSize.x / Math.min(boxSize.x, otherBoxSize.x);
        const yOverlapPercent = intersectionSize.y / Math.min(boxSize.y, otherBoxSize.y);
        const zOverlapPercent = intersectionSize.z / Math.min(boxSize.z, otherBoxSize.z);
        
        // Calculate center-to-center distance in each dimension
        const boxCenter = new Vector3();
        box.getCenter(boxCenter);
        const otherBoxCenter = new Vector3();
        otherBox.getCenter(otherBoxCenter);
        const centerDistance = boxCenter.clone().sub(otherBoxCenter);
        
        // Allow vertical stacking: if modules are directly on top of each other
        const isVerticalStack = 
          Math.abs(centerDistance.x) < 0.1 && 
          Math.abs(centerDistance.z) < 0.1 && 
          Math.abs(centerDistance.y) >= Math.min(boxSize.y, otherBoxSize.y) * 0.4;
          
        // Allow side-by-side placement: if modules are next to each other with minimal overlap
        const isSideBySide = 
          (Math.abs(centerDistance.x) >= Math.min(boxSize.x, otherBoxSize.x) * 0.4 || 
           Math.abs(centerDistance.z) >= Math.min(boxSize.z, otherBoxSize.z) * 0.4) &&
          yOverlapPercent < 0.2; // Allow small vertical overlap
        
        // Determine if it's a valid connection
        const isValidConnection = isVerticalStack || isSideBySide;
        
        // Only count as collision if it's not a valid connection
        if (!isValidConnection) {
          hasCollision = true;
        }
      }
    });
    
    handleCollision(hasCollision);
    
    if (hasCollision) {
      // Revert position with smooth animation
      gsap.to(meshRef.current.position, {
        x: module.position[0],
        y: module.position[1],
        z: module.position[2],
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: updateShadowTransform
      });
      
      gsap.to(meshRef.current.rotation, {
        x: module.rotation[0],
        y: module.rotation[1],
        z: module.rotation[2],
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: updateShadowTransform
      });
    } else {
      onUpdate?.({
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
      });
    }
    
    updateShadowTransform();
  }, [
    readOnly, onUpdate, module.id, module.dimensions, module.position, 
    module.rotation, modules, gridSnap, isShiftPressed, transformMode, 
    isTransforming, updateShadowTransform, handleCollision
  ]);

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
  }, [meshRef.current?.rotation]);

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
          color='#000000'
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>

      {/* Floating Controls - Moved further up */}
      {(showControls || hovered || selected) && !readOnly && (
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[
            meshRef.current ? meshRef.current.position.x : module.position[0],
            (meshRef.current ? meshRef.current.position.y : module.position[1]) + module.dimensions.height + 5, // Increased distance
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