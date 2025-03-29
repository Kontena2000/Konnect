import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Vector3, Mesh, Euler, PerspectiveCamera, OrthographicCamera } from "three";
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
  const [animating, setAnimating] = useState(true);
  const { camera } = useThree();
  const [shadowTransform, setShadowTransform] = useState({
    position: new Vector3(module.position[0], 0.01, module.position[2]),
    rotation: new Euler(-Math.PI/2, 0, 0)
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
    onUpdate
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

  const handleRotateLeft = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= Math.PI/2;
      handleTransformChange(meshRef, updateShadowTransform);
    }
  }, [handleTransformChange, updateShadowTransform]);

  const handleRotateRight = useCallback(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += Math.PI/2;
      handleTransformChange(meshRef, updateShadowTransform);
    }
  }, [handleTransformChange, updateShadowTransform]);

  return (
    <group>
      <ModuleMesh
        module={module}
        meshRef={meshRef}
        editorPreferences={editorPreferences}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />

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
          onTransformEnd={() => {
            setIsTransforming(false);
            onTransformEnd?.();
            handleTransformChange(meshRef, updateShadowTransform);
          }}
          onUpdate={() => handleTransformChange(meshRef, updateShadowTransform)}
        />
      )}
      
      {module.connectionPoints?.map((point, index) => (
        <ConnectionPoint
          key={`${module.id}-connection-${index}`}
          position={point.position}
          type={point.types?.[0] || point.type || "power"}
          moduleId={module.id}
        />
      ))}
    </group>
  );
}