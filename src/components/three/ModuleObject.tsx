import { useRef, useState, useEffect } from "react";
import { Object3D, MeshStandardMaterial, Vector3 } from "three";
import { ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import { Module } from "@/types/module";
import { ConnectionPoint } from "./ConnectionPoint";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface ModuleObjectProps {
  module: Module;
  selected?: boolean;
  onClick?: () => void;
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
  const meshRef = useRef<Object3D>(null);
  const [hovered, setHovered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const castShadow = module.castShadow !== false;
  const receiveShadow = module.receiveShadow !== false;
  const [modelLoadError, setModelLoadError] = useState(false);

  // Try to load the model if a URL is provided
  let model = null;
  if (module.modelUrl) {
    try {
      // Wrap in useEffect to avoid React Hook rules violation
      useEffect(() => {
        const loadModel = async () => {
          try {
            const loader = new GLTFLoader();
            loader.load(
              module.modelUrl as string,
              (gltf) => {
                model = gltf.scene.clone();
                setModelLoadError(false);
              },
              undefined,
              (error) => {
                console.error(`Error loading model from ${module.modelUrl}:`, error);
                setModelLoadError(true);
              }
            );
          } catch (error) {
            console.error(`Error setting up model loader for ${module.modelUrl}:`, error);
            setModelLoadError(true);
          }
        };
        
        loadModel();
      }, [module.modelUrl]);
    } catch (error) {
      console.error(`Error in model loading setup for ${module.modelUrl}:`, error);
      setModelLoadError(true);
    }
  }

  // Handle transform changes
  const handleTransformChange = () => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.toArray() as [number, number, number];
    const rotation = meshRef.current.rotation.toArray() as [number, number, number];
    const scale = meshRef.current.scale.toArray() as [number, number, number];
    
    onUpdate?.({
      position,
      rotation,
      scale
    });
  };

  // Mouse event handlers
  const handleMouseEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    // Keep controls visible if selected
    if (!selected) {
      setShowControls(false);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick?.();
  };

  // Keep controls visible when selected
  useEffect(() => {
    if (selected) {
      setShowControls(true);
    } else {
      setShowControls(false);
    }
  }, [selected]);

  // Reset position if module position changes from outside
  useEffect(() => {
    if (meshRef.current) {
      const newPosition = new Vector3(...module.position);
      if (!meshRef.current.position.equals(newPosition)) {
        meshRef.current.position.copy(newPosition);
      }
    }
  }, [module.position]);

  return (
    <group>
      {model && !modelLoadError ? (
        <primitive 
          object={model}
          ref={meshRef}
          position={module.position}
          rotation={module.rotation}
          scale={module.scale}
          onPointerOver={handleMouseEnter}
          onPointerOut={handleMouseLeave}
          onClick={handleClick}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ) : (
        <mesh
          ref={meshRef}
          position={module.position}
          rotation={module.rotation}
          scale={module.scale}
          onPointerOver={handleMouseEnter}
          onPointerOut={handleMouseLeave}
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
            transparent={hovered || selected}
            opacity={hovered || selected ? 0.8 : 1}
            wireframe={module.wireframe}
          />
        </mesh>
      )}
      
      {/* Rotation controls */}
      {showControls && !readOnly && (
        <Html position={[0, module.dimensions.height + 0.5, 0]}>
          <div className="bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1">
            <button 
              className="p-1 hover:bg-accent rounded" 
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
              className="p-1 hover:bg-accent rounded" 
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
          </div>
        </Html>
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