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
  readOnly = false
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
  const previewPosition = useRef<[number, number, number]>([0, 0, 0]);

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
    
    previewPosition.current = [intersection.x, previewHeight / 2, intersection.z];
    setShowRotationControls(true);
  }, [isDraggingOver, mousePosition, camera, gridSnap, previewHeight, readOnly]);

  return (
    <>
      {/* Scene lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.4} />

      {/* Grid and controls */}
      <Grid 
        infiniteGrid 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#666" 
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#888"
        fadeDistance={50}
        fadeStrength={1.5}
      />
      <OrbitControls 
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        minDistance={1}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />

      {/* Render modules */}
      {modules.map(module => (
        <ModuleObject
          key={module.id}
          module={module}
          selected={module.id === selectedModuleId}
          onClick={() => onModuleSelect?.(module.id)}
          onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          gridSnap={gridSnap}
          readOnly={readOnly}
        />
      ))}

      {/* Render connections */}
      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          selected={false}
        />
      ))}

      {/* Environmental elements */}
      {environmentalElements.map(element => (
        <EnvironmentalElement
          key={element.id}
          element={element}
          onClick={() => onEnvironmentalElementSelect?.(element.id)}
        />
      ))}

      {/* Terrain if available */}
      {terrain && (
        <TerrainView terrain={terrain} />
      )}

      {/* Guide lines when holding shift */}
      {showGuides && snapLines.map((line, index) => (
        <Line
          key={`guide-line-${index}`}
          points={[
            [line.start.x, 0.05, line.start.z],
            [line.end.x, 0.05, line.end.z]
          ]}
          color="yellow"
          lineWidth={1}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />
      ))}

      {/* Snap points */}
      {showGuides && snapPoints.map((point, index) => (
        <mesh
          key={`guide-point-${index}`}
          position={[point.x, 0.05, point.z]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      ))}

      {/* Preview mesh during drag */}
      {previewMesh && isDraggingOver && (
        <group position={previewPosition.current} rotation={[0, rotationAngle, 0]}>
          <primitive object={previewMesh} />
          {showRotationControls && (
            <Html position={[0, previewHeight + 0.5, 0]}>
              <div className='bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1'>
                <button 
                  className='p-1 hover:bg-accent rounded' 
                  onClick={() => {
                    setRotationAngle(prev => prev - Math.PI/2);
                  }}
                >
                  ⟲
                </button>
                <button 
                  className='p-1 hover:bg-accent rounded' 
                  onClick={() => {
                    setRotationAngle(prev => prev + Math.PI/2);
                  }}
                >
                  ⟳
                </button>
              </div>
            </Html>
          )}
        </group>
      )}
    </>
  );
}