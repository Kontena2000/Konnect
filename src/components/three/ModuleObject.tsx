
import { useEffect, useRef, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";
import type { Mesh, Object3D } from "three";
import { Box3 } from 'three';
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Trash2 } from "lucide-react";

export interface ModuleObjectProps {
  module: Module;
  selected?: boolean;
  onSelect?: () => void;
  onUpdate?: (updates: Partial<Module>) => void;
  onDelete?: () => void;
  transformMode?: "translate" | "rotate" | "scale";
  readOnly?: boolean;
  gridSnap?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function ModuleObject({
  module,
  selected = false,
  onSelect,
  onUpdate,
  onDelete,
  transformMode = "translate",
  readOnly = false,
  gridSnap = true,
  castShadow = false,
  receiveShadow = false
}: ModuleObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (meshRef.current) {
      const box = new Box3().setFromObject(meshRef.current);
      const size = box.getSize(box.max);
      
      if (onUpdate && (
        size.x !== module.dimensions.length ||
        size.y !== module.dimensions.height ||
        size.z !== module.dimensions.width
      )) {
        onUpdate({
          dimensions: {
            length: size.x,
            height: size.y,
            width: size.z
          }
        });
      }
    }
  }, [module, onUpdate]);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setShowControls(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    // Keep controls visible if selected
    if (!selected) {
      setShowControls(false);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect?.();
    setShowControls(true);
  };

  const handleTransformChange = () => {
    if (meshRef.current && onUpdate) {
      const position = meshRef.current.position.toArray() as [number, number, number];
      const rotation = meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number];
      const scale = meshRef.current.scale.toArray() as [number, number, number];
      
      onUpdate({ position, rotation, scale });
    }
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (meshRef.current && onUpdate) {
      const currentRotation = meshRef.current.rotation.y;
      const newRotation = direction === 'left' 
        ? currentRotation - Math.PI / 2 
        : currentRotation + Math.PI / 2;
      
      onUpdate({ 
        rotation: [
          meshRef.current.rotation.x,
          newRotation,
          meshRef.current.rotation.z
        ] 
      });
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={module.position}
        rotation={module.rotation}
        scale={module.scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry
          args={[
            module.dimensions.length,
            module.dimensions.height,
            module.dimensions.width
          ]}
        />
        <meshStandardMaterial
          color={module.color}
          transparent={selected || hovered}
          opacity={selected ? 0.8 : hovered ? 0.9 : 1}
        />
      </mesh>

      {(selected || showControls) && !readOnly && (
        <group position={[
          module.position[0],
          module.position[1] + module.dimensions.height / 2 + 0.5,
          module.position[2]
        ]}>
          <Html center>
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleRotate('left')}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleRotate('right')}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              {selected && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Html>
        </group>
      )}

      {selected && !readOnly && (
        <TransformControls
          object={meshRef.current as Object3D}
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
