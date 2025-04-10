import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Vector3, Mesh, Euler, PerspectiveCamera, OrthographicCamera, Group } from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";
import { ModuleMesh } from "./ModuleMesh";
import { ModuleShadow } from "./ModuleShadow";
import { ModuleControls } from "./ModuleControls";
import { ModuleTransform } from "./ModuleTransform";
import { ModuleAnimation } from "./ModuleAnimation";
import { useModuleTransform } from "@/hooks/use-module-transform";
import { EditorPreferences } from "@/services/editor-preferences";
import { ConnectionType } from "@/types/connection";
import gsap from "gsap";

interface ModuleObjectProps {
  module: Module;
  modules?: Module[];
  selected?: boolean;
  onClick?: () => void;
  onUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onDelete?: () => void;
  transformMode?: "translate" | "rotate" | "scale";
  gridSnap?: boolean;
  readOnly?: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  editorPreferences?: EditorPreferences | null;
}

export function ModuleObject({
  module,
  modules = [],
  selected = false,
  onClick,
  onUpdate,
  onDelete,
  transformMode = "translate",
  gridSnap = true,
  readOnly = false,
  onTransformStart,
  onTransformEnd,
  editorPreferences
}: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const [animating, setAnimating] = useState(true);
  const { camera } = useThree();
  const [shadowTransform, setShadowTransform] = useState({
    position: new Vector3(module.position[0], 0.01, module.position[2]),
    rotation: new Euler(-Math.PI/2, module.rotation[1] * Math.PI / 180, 0)
  });

  const {
    isShiftPressed,
    setIsShiftPressed,
    isTransforming,
    setIsTransforming,
    handleTransformChange
  } = useModuleTransform({
    module,
    modules,
    gridSnap,
    readOnly,
    transformMode,
    onUpdate: (updates) => onUpdate?.(module.id, updates)
  });

  const initialPosition = useMemo(() => new Vector3(
    module.position[0],
    module.position[1] + 5,
    module.position[2]
  ), [module.position]);

  const updateShadowTransform = useCallback(() => {
    if (!meshRef.current) return;
    
    setShadowTransform({
      position: new Vector3(
        meshRef.current.position.x,
        0.01,
        meshRef.current.position.z
      ),
      rotation: new Euler(
        -Math.PI/2,
        meshRef.current.rotation.y,
        0
      )
    });
  }, []);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  }, [onClick]);

  // Handle transform end - ensure position is saved
  const handleTransformEnd = useCallback(() => {
    if (!meshRef.current || !onUpdate) return;
    
    setIsTransforming(false);
    
    // Get final position after transform
    const finalPosition: [number, number, number] = [
      Number(meshRef.current.position.x),
      Number(meshRef.current.position.y),
      Number(meshRef.current.position.z)
    ];
    
    // Get final rotation after transform - convert from radians to degrees
    const finalRotation: [number, number, number] = [
      Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
      Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
      Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
    ];
    
    // Get final scale after transform
    const finalScale: [number, number, number] = [
      Number(meshRef.current.scale.x),
      Number(meshRef.current.scale.y),
      Number(meshRef.current.scale.z)
    ];
    
    console.log('Transform ended, updating module with final position:', module.id, finalPosition, 'rotation:', finalRotation);
    
    // Force immediate update with final transform values to ensure they're saved
    onUpdate(module.id, {
      position: finalPosition,
      rotation: finalRotation,
      scale: finalScale
    });
    
    // Update shadow
    updateShadowTransform();
    
    // Call the parent onTransformEnd after our updates
    onTransformEnd?.();
  }, [module.id, onUpdate, onTransformEnd, updateShadowTransform, setIsTransforming]);

  const handleRotateLeft = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= Math.PI/2;
      
      // Get current rotation after change
      const newRotation: [number, number, number] = [
        Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
        Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
        Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
      ];
      
      console.log('Rotate left, new rotation:', newRotation);
      
      // Update module with new rotation
      onUpdate?.(module.id, {
        rotation: newRotation
      });
      
      // Update shadow
      updateShadowTransform();
    }
  }, [module.id, onUpdate, updateShadowTransform]);

  const handleRotateRight = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += Math.PI/2;
      
      // Get current rotation after change
      const newRotation: [number, number, number] = [
        Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
        Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
        Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
      ];
      
      console.log('Rotate right, new rotation:', newRotation);
      
      // Update module with new rotation
      onUpdate?.(module.id, {
        rotation: newRotation
      });
      
      // Update shadow
      updateShadowTransform();
    }
  }, [module.id, onUpdate, updateShadowTransform]);

  // Update position, rotation, scale when module props change
  useEffect(() => {
    if (meshRef.current) {
      // Update position
      if (module.position && Array.isArray(module.position) && module.position.length === 3) {
        // Ensure position values are numbers
        const numPosition = module.position.map(Number) as [number, number, number];
        meshRef.current.position.set(numPosition[0], numPosition[1], numPosition[2]);
      }
      
      // Update rotation
      if (module.rotation && Array.isArray(module.rotation) && module.rotation.length === 3) {
        // Ensure rotation values are numbers
        const numRotation = module.rotation.map(Number) as [number, number, number];
        meshRef.current.rotation.set(
          numRotation[0] * Math.PI / 180,
          numRotation[1] * Math.PI / 180,
          numRotation[2] * Math.PI / 180
        );
        
        // Log rotation values for debugging
        console.log(`Module ${module.id} rotation set to:`, 
          numRotation, 
          'radians:', [
            numRotation[0] * Math.PI / 180,
            numRotation[1] * Math.PI / 180,
            numRotation[2] * Math.PI / 180
          ]
        );
      }
      
      // Update scale
      if (module.scale && Array.isArray(module.scale) && module.scale.length === 3) {
        // Ensure scale values are numbers
        const numScale = module.scale.map(Number) as [number, number, number];
        meshRef.current.scale.set(numScale[0], numScale[1], numScale[2]);
      }
      
      // Update shadow
      updateShadowTransform();
    }
  }, [module.position, module.rotation, module.scale, updateShadowTransform, module.id]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[module.position[0], module.position[1], module.position[2]]}
        rotation={[
          module.rotation[0] * Math.PI / 180,
          module.rotation[1] * Math.PI / 180,
          module.rotation[2] * Math.PI / 180
        ]}
        scale={[module.scale[0], module.scale[1], module.scale[2]]}
      >
        <ModuleMesh
          module={module}
          meshRef={meshRef}
          editorPreferences={editorPreferences}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        />

        {module.connectionPoints?.map((point, index) => (
          <ConnectionPoint
            key={`${module.id}-connection-${index}`}
            position={point.position}
            type={(point.types?.[0] || point.type || "power") as ConnectionType}
            moduleId={module.id}
          />
        ))}
      </mesh>

      <ModuleShadow
        module={module}
        position={shadowTransform.position}
        rotation={shadowTransform.rotation}
      />

      {animating && (
        <ModuleAnimation
          meshRef={meshRef}
          initialPosition={initialPosition}
          finalHeight={module.dimensions.height / 2}
          onComplete={() => setAnimating(false)}
          onUpdate={updateShadowTransform}
        />
      )}

      {selected && !readOnly && (
        <ModuleControls
          meshRef={meshRef}
          camera={camera as PerspectiveCamera | OrthographicCamera}
          position={[
            meshRef.current ? meshRef.current.position.x : module.position[0],
            (meshRef.current ? meshRef.current.position.y : module.position[1]) + module.dimensions.height + 3,
            meshRef.current ? meshRef.current.position.z : module.position[2]
          ]}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onDelete={onDelete}
        />
      )}
      
      {selected && !readOnly && meshRef.current && (
        <ModuleTransform
          meshRef={meshRef}
          transformMode={transformMode}
          gridSnap={gridSnap && !isShiftPressed}
          onTransformStart={() => {
            setIsTransforming(true);
            onTransformStart?.();
          }}
          onTransformEnd={handleTransformEnd}
          onUpdate={() => {
            // This is called continuously during transform
            if (meshRef.current) {
              // Get current position during transform
              const currentPosition: [number, number, number] = [
                Number(meshRef.current.position.x),
                Number(meshRef.current.position.y),
                Number(meshRef.current.position.z)
              ];
              
              // Get current rotation during transform - convert from radians to degrees
              const currentRotation: [number, number, number] = [
                Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
                Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
                Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
              ];
              
              // Get current scale during transform
              const currentScale: [number, number, number] = [
                Number(meshRef.current.scale.x),
                Number(meshRef.current.scale.y),
                Number(meshRef.current.scale.z)
              ];
              
              // Log rotation values for debugging
              console.log(`Module ${module.id} rotation during transform:`, currentRotation);
              
              // Update position in real-time during transform
              onUpdate?.(module.id, {
                position: currentPosition,
                rotation: currentRotation,
                scale: currentScale
              });
              
              // Update shadow
              updateShadowTransform();
            }
          }}
        />
      )}
    </group>
  );
}