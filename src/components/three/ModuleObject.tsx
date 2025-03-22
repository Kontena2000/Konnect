import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Object3D, MeshStandardMaterial, Vector3, Mesh, Box3, Euler, DoubleSide, Matrix4, Quaternion, Color } from "three";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html, Billboard } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";
import gsap from "gsap";
import { EditorPreferences } from '@/services/editor-preferences';

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
  editorPreferences?: EditorPreferences | null;
}

interface ShadowTransform {
  position: Vector3;
  rotation: Euler;
  scale: [number, number, number];
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
  onTransformEnd,
  editorPreferences
}: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const transformRef = useRef<any>(null);
  const [showControls, setShowControls] = useState(selected);
  const [animating, setAnimating] = useState(true);
  const { camera } = useThree();
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [shadowTransform, setShadowTransform] = useState<ShadowTransform>({
    position: new Vector3(module.position[0], 0.01, module.position[2]),
    rotation: new Euler(-Math.PI/2, 0, 0),
    scale: [1, 1, 1]
  });

  // Memoize initial position for drop animation
  const initialPosition = useMemo(() => new Vector3(
    module.position[0],
    module.position[1] + 5,
    module.position[2]
  ), [module.position]);

  // Simplified shadow transform calculation
  const updateShadowTransform = useCallback(() => {
    if (!meshRef.current) return;
    
    // 1. Position the shadow directly below the object
    const shadowPosition = new Vector3(
      meshRef.current.position.x,
      0.01, // Just above ground
      meshRef.current.position.z
    );

    // 2. For rotation, only take the Y component from the object
    const objectYRotation = meshRef.current.rotation.y;
    
    // 3. Create a shadow rotation that's flat on the ground but rotated to match object
    const shadowRotation = new Euler(
      -Math.PI/2, // This is crucial - makes it lie flat on XZ plane
      objectYRotation,
      0
    );
    
    // 4. Update shadow transform state
    setShadowTransform({
      position: shadowPosition,
      rotation: shadowRotation,
      scale: [1, 1, 1] // Start with no scaling
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

  // Remove handleCollision since we won't be using visual feedback
  const handleCollision = useCallback((hasCollision: boolean) => {
    // Empty function - we're not showing collision feedback anymore
  }, []);

  // Enhanced transform handling with elevation behavior
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
          duration: 0.1, // Faster animation
          ease: 'power1.out', // Smoother easing
          onUpdate: updateShadowTransform
        });
        
        position.copy(snappedPosition);
      }
      
      if (transformMode === 'rotate') {
        const targetRotation = Math.round(rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        gsap.to(meshRef.current.rotation, {
          y: targetRotation,
          duration: 0.1, // Faster animation
          ease: 'power1.out', // Smoother easing
          onUpdate: updateShadowTransform
        });
        rotation.y = targetRotation;
      }
    }
    
    // Check collisions and implement elevation behavior
    const box = new Box3().setFromObject(meshRef.current);
    let adjustedPosition = position.clone();
    let maxCollisionHeight = minHeight;
    
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
      
      // Check if boxes intersect in XZ plane (ignoring Y)
      const xzIntersection = (
        box.min.x <= otherBox.max.x &&
        box.max.x >= otherBox.min.x &&
        box.min.z <= otherBox.max.z &&
        box.max.z >= otherBox.min.z
      );
      
      if (xzIntersection && selected) {
        // Calculate exact height needed to place on top
        const collisionHeight = otherPos.y + otherModule.dimensions.height/2 + module.dimensions.height/2;
        maxCollisionHeight = Math.max(maxCollisionHeight, collisionHeight);
      }
    });
    
    // Apply elevation with smoother animation
    if (maxCollisionHeight > minHeight) {
      gsap.to(meshRef.current.position, {
        y: maxCollisionHeight,
        duration: 0.15, // Faster animation
        ease: 'power2.out', // Smoother easing
        onUpdate: updateShadowTransform
      });
      adjustedPosition.y = maxCollisionHeight;
    } else {
      // Return to normal height if no collision
      gsap.to(meshRef.current.position, {
        y: minHeight,
        duration: 0.15, // Faster animation
        ease: 'power2.out', // Smoother easing
        onUpdate: updateShadowTransform
      });
      adjustedPosition.y = minHeight;
    }
    
    // Update module state with new position
    onUpdate?.({
      position: [adjustedPosition.x, adjustedPosition.y, adjustedPosition.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
    });
    
    updateShadowTransform();
  }, [
    readOnly, onUpdate, module.id, module.dimensions, selected,
    gridSnap, isShiftPressed, transformMode, isTransforming, 
    updateShadowTransform, modules
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
      updateShadowTransform();
    }
  }, [meshRef.current?.rotation, meshRef.current?.position, updateShadowTransform]);

  return (
    <group>
      <mesh 
        ref={meshRef}
        position={module.position}
        rotation={module.rotation}
        scale={module.scale}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
          wireframe={module.wireframe}
        />
      </mesh>

      {/* Shadow */}
      <mesh
        position={[meshRef.current?.position.x || 0, 0.01, meshRef.current?.position.z || 0]}
        rotation={[Math.PI/2, 0, meshRef.current?.rotation.y || 0]}
      >
        <planeGeometry args={[module.dimensions.length, module.dimensions.width]} />
        <meshBasicMaterial 
          color='#000000'
          transparent
          opacity={0.2}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Floating Controls - Only show when selected */}
      {selected && !readOnly && (
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[
            meshRef.current ? meshRef.current.position.x : module.position[0],
            (meshRef.current ? meshRef.current.position.y : module.position[1]) + module.dimensions.height + 3,
            meshRef.current ? meshRef.current.position.z : module.position[2]
          ]}
        >
          <Html
            center
            style={{
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              transform: `scale(${camera.zoom < 1 ? 1 / camera.zoom : 1})`,
              opacity: 0.8
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