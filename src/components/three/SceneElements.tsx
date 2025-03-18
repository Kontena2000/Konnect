import { useThree } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, Line, Html } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { ConnectionLine } from "./ConnectionLine";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useRef, useEffect, useState } from "react";
import { Vector2, Vector3, Line3, Mesh, Object3D } from "three";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import * as THREE from "three";
import { GridHelper } from './GridHelper';
import { CameraControls } from './CameraControls';

interface SceneElementsProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections: Connection[];
  environmentalElements?: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  gridSnap?: boolean;
  isDraggingOver?: boolean;
  previewMesh: Mesh | null;
  rotationAngle: number;
  showGuides?: boolean;
  snapPoints: Vector3[];
  snapLines: Line3[];
  previewHeight: number;
  mousePosition: Vector2 | null;
  onDropPoint?: (point: [number, number, number]) => void;
  readOnly?: boolean;
  previewPosition?: [number, number, number];
  setRotationAngle: (angle: number | ((prev: number) => number)) => void;
}

export function SceneElements({
  modules,
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  gridSnap = true,
  isDraggingOver = false,
  previewMesh,
  rotationAngle,
  showGuides = false,
  snapPoints,
  snapLines,
  previewHeight,
  mousePosition,
  onDropPoint,
  readOnly = false,
  previewPosition = [0, 0, 0],
  setRotationAngle
}: SceneElementsProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const selectedRef = useRef<Object3D | null>(null);
  const [showRotationControls, setShowRotationControls] = useState(false);

  // Reset camera position on mount
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Calculate preview position based on mouse position
  const previewPositionRef = useRef<[number, number, number]>([0, 0, 0]);

  // Enhanced drag over handler
  useEffect(() => {
    if (!isDraggingOver || !mousePosition || !camera || readOnly) return;
    
    const x = ((mousePosition.x) / window.innerWidth) * 2 - 1;
    const y = -((mousePosition.y) / window.innerHeight) * 2 + 1;
    
    // Cast ray to find intersection with ground plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);
    
    // Snap to grid
    if (gridSnap) {
      intersection.x = Math.round(intersection.x);
      intersection.z = Math.round(intersection.z);
    } else {
      intersection.x = Math.round(intersection.x * 2) / 2;
      intersection.z = Math.round(intersection.z * 2) / 2;
    }
    
    previewPositionRef.current = [intersection.x, previewHeight / 2, intersection.z];
    setShowRotationControls(true);
  }, [isDraggingOver, mousePosition, camera, gridSnap, previewHeight, readOnly]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Camera controls */}
      <CameraControls />
      
      {/* Grid */}
      <GridHelper />

      {/* Environment */}
      {terrain && <TerrainView terrain={terrain} />}
      
      {/* Environmental elements */}
      {environmentalElements?.map(element => (
        <EnvironmentalElement
          key={element.id}
          element={element}
          selected={false}
          onClick={() => onEnvironmentalElementSelect?.(element.id)}
        />
      ))}

      {/* Modules */}
      {modules.map(module => (
        <ModuleObject
          key={module.id}
          module={module}
          selected={module.id === selectedModuleId}
          onClick={() => onModuleSelect?.(module.id)}
          onUpdate={updates => onModuleUpdate?.(module.id, updates)}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          gridSnap={gridSnap}
          readOnly={readOnly}
        />
      ))}

      {/* Connections */}
      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
        />
      ))}

      {/* Preview mesh during drag */}
      {isDraggingOver && previewMesh && (
        <group position={previewPositionRef.current} rotation={[0, rotationAngle, 0]}>
          <primitive object={previewMesh.clone()} />
          
          {/* Rotation controls for preview */}
          <Html position={[0, 2, 0]}>
            <div className='bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1'>
              <button 
                className='p-1 hover:bg-accent rounded' 
                onClick={(e) => {
                  e.stopPropagation();
                  setRotationAngle(prev => prev - Math.PI/2);
                }}
              >
                ⟲
              </button>
              <button 
                className='p-1 hover:bg-accent rounded' 
                onClick={(e) => {
                  e.stopPropagation();
                  setRotationAngle(prev => prev + Math.PI/2);
                }}
              >
                ⟳
              </button>
            </div>
          </Html>
        </group>
      )}

      {/* Snap guides */}
      {isDraggingOver && showGuides && (
        <>
          {/* Snap points */}
          {snapPoints.map((point, i) => (
            <mesh key={`point-${i}`} position={[point.x, 0.01, point.z]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color='#ffcc00' transparent opacity={0.5} />
            </mesh>
          ))}
          
          {/* Snap lines */}
          {snapLines.map((line, i) => (
            <line key={`line-${i}`}>
              <bufferGeometry 
                attach='geometry' 
                args={[
                  new Float32Array([
                    line.start.x, 0.01, line.start.z,
                    line.end.x, 0.01, line.end.z
                  ]), 
                  3
                ]} 
              />
              <lineBasicMaterial attach='material' color='#ffcc00' opacity={0.5} transparent />
            </line>
          ))}
        </>
      )}
    </>
  );
}