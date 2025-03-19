import { useThree } from "@react-three/fiber";
import { ModuleObject } from "./ModuleObject";
import { ConnectionLine } from "./ConnectionLine";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useRef, useEffect } from "react";
import { Vector2, Vector3, Line3, Mesh, Object3D, BufferGeometry, Float32BufferAttribute } from "three";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import { GridHelper } from "./GridHelper";
import { CameraControls, CameraControlsHandle } from './CameraControls';
import { Html } from "@react-three/drei";
import { useGridSnapping } from '@/hooks/use-grid-snapping';

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
  previewPosition: [number, number, number];
  readOnly?: boolean;
  setRotationAngle: (angle: number | ((prev: number) => number)) => void;
  controlsRef?: React.RefObject<CameraControlsHandle>;
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
  previewPosition,
  readOnly = false,
  setRotationAngle,
  controlsRef,
}: SceneElementsProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

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
      
      <CameraControls ref={controlsRef} locked={!!selectedModuleId} />
      <GridHelper />

      {terrain && <TerrainView terrain={terrain} />}
      
      {environmentalElements?.map(element => (
        <EnvironmentalElement
          key={element.id}
          element={element}
          selected={false}
          onClick={() => onEnvironmentalElementSelect?.(element.id)}
        />
      ))}

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

      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
        />
      ))}

      {isDraggingOver && previewMesh && (
        <group>
          {gridSnap && showGuides && snapPoints.map((point, i) => (
            <mesh key={`snap-point-${i}`} position={[point.x, 0.01, point.z]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color='#F1B73A' transparent opacity={0.5} />
            </mesh>
          ))}
          
          {/* Position preview mesh with bottom at ground level */}
          <group 
            position={[
              previewPosition[0], 
              previewPosition[1], // Keep at ground level
              previewPosition[2]
            ]} 
            rotation={[0, rotationAngle, 0]}
          >
            <primitive object={previewMesh.clone()} />
            <Html
              position={[0, previewMesh.geometry.boundingBox?.max.y || 2, 0]}
              center
              style={{ pointerEvents: 'auto' }}
            >
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
        </group>
      )}

      {showGuides && snapLines.map((line, i) => {
        const geometry = new BufferGeometry();
        const vertices = new Float32Array([
          line.start.x, 0.01, line.start.z,
          line.end.x, 0.01, line.end.z
        ]);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        
        return (
          <line key={`line-${i}`}>
            <primitive object={geometry} />
            <lineBasicMaterial color="#ffcc00" opacity={0.5} transparent />
          </line>
        );
      })}
    </>
  );
}