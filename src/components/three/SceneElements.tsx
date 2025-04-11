import { useThree } from "@react-three/fiber";
import { ModuleObject } from "./ModuleObject";
import { ConnectionLine } from "./ConnectionLine";
import { Module, ModuleDimensions } from "@/types/module";
import { Connection } from "@/services/layout";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useRef, useEffect, useState } from "react";
import { Vector2, Vector3, Line3, Mesh, Object3D, BufferAttribute, BufferGeometry, LineBasicMaterial, Float32BufferAttribute, Plane } from "three";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import { GridHelper } from "./GridHelper";
import { CameraControls } from "./CameraControls";
import { Html } from "@react-three/drei";
import { EditorPreferences } from "@/services/editor-preferences";

interface SceneElementsProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections?: Connection[];
  environmentalElements?: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  gridSnap?: boolean;
  isDraggingOver?: boolean;
  previewMesh?: Mesh | null;
  rotationAngle?: number;
  showGuides?: boolean;
  snapPoints?: Vector3[];
  snapLines?: Line3[];
  previewPosition?: [number, number, number];
  readOnly?: boolean;
  setRotationAngle?: (angle: number | ((prev: number) => number)) => void;
  isTransforming?: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  editorPreferences?: EditorPreferences | null;
  controlsRef?: React.RefObject<any>;
  draggedDimensions?: ModuleDimensions | null;
}

export function SceneElements({
  modules,
  selectedModuleId,
  transformMode,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections = [],
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  gridSnap = false,
  isDraggingOver = false,
  previewMesh = null,
  rotationAngle = 0,
  showGuides = false,
  snapPoints = [],
  snapLines = [],
  previewPosition = [0, 0, 0],
  readOnly = false,
  setRotationAngle = () => {},
  isTransforming = false,
  onTransformStart,
  onTransformEnd,
  editorPreferences,
  controlsRef,
  draggedDimensions
}: SceneElementsProps) {
  const { scene, camera, raycaster, gl, pointer } = useThree();
  const [groundPlane] = useState(() => new Plane(new Vector3(0, 1, 0), 0));
  const [intersectionPoint] = useState(() => new Vector3());
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDimensions, setPreviewDimensions] = useState<ModuleDimensions | null>(null);
  
  // Use draggedDimensions if available, otherwise use default dimensions
  useEffect(() => {
    if (draggedDimensions) {
      setPreviewDimensions(draggedDimensions);
      console.log('Preview dimensions set to:', draggedDimensions);
    } else {
      setPreviewDimensions({ width: 1, height: 1, depth: 1 });
    }
  }, [draggedDimensions]);

  const internalControlsRef = useRef<any>(null);
  const actualControlsRef = controlsRef || internalControlsRef;

  useEffect(() => {
    if (camera) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Update preview mesh when dragging over
  useEffect(() => {
    if (isDraggingOver && previewDimensions) {
      setPreviewVisible(true);
    } else {
      setPreviewVisible(false);
    }
  }, [isDraggingOver, previewDimensions]);

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
      
      <CameraControls 
        controlsRef={actualControlsRef}
        enabled={!isTransforming}
        enableZoom={!isTransforming}
        enablePan={!isTransforming}
        enableRotate={!isTransforming}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
      />
      <GridHelper preferences={editorPreferences?.grid} />

      {terrain && <TerrainView terrain={terrain} />}
      
      {environmentalElements?.map(element => (
        <EnvironmentalElement
          key={element.id}
          element={element}
          onClick={() => onEnvironmentalElementSelect?.(element.id)}
        />
      ))}

      {modules.map(module => (
        <ModuleObject
          key={module.id}
          module={module}
          modules={modules}
          selected={module.id === selectedModuleId}
          onClick={() => onModuleSelect?.(module.id)}
          onUpdate={(moduleUpdates) => {
            if (onModuleUpdate) {
              onModuleUpdate(module.id, moduleUpdates as Partial<Module>);
            }
          }}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          gridSnap={gridSnap}
          readOnly={readOnly}
          onTransformStart={onTransformStart}
          onTransformEnd={onTransformEnd}
          editorPreferences={editorPreferences}
        />
      ))}

      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
        />
      ))}

      {isDraggingOver && previewMesh && (
        <group position={previewPosition} rotation={[0, rotationAngle, 0]}>
          <primitive object={previewMesh.clone()} />
          <Html position={[0, 2, 0]}>
            <div className="bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1">
              <button 
                className="p-1 hover:bg-accent rounded"
                onClick={() => setRotationAngle(prev => prev - Math.PI/2)}
              >
                ⟲
              </button>
              <button 
                className="p-1 hover:bg-accent rounded"
                onClick={() => setRotationAngle(prev => prev + Math.PI/2)}
              >
                ⟳
              </button>
            </div>
          </Html>
        </group>
      )}

      {showGuides && snapPoints.map((point, i) => (
        <mesh key={`point-${i}`} position={[point.x, 0.01, point.z]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.5} />
        </mesh>
      ))}
      
      {showGuides && snapLines.map((line, i) => {
        const positions = new Float32Array([
          line.start.x, 0.01, line.start.z,
          line.end.x, 0.01, line.end.z
        ]);
        return (
          <line key={`line-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach='attributes-position'
                array={positions}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color='#ffcc00' opacity={0.5} transparent />
          </line>
        );
      })}

      {/* Preview mesh for drag and drop */}
      {previewVisible && previewDimensions && (
        <mesh 
          position={[previewPosition[0], previewDimensions.height / 2, previewPosition[2]]}
          rotation={[0, rotationAngle, 0]}
        >
          <boxGeometry 
            args={[
              previewDimensions.width,
              previewDimensions.height,
              previewDimensions.depth
            ]} 
          />
          <meshStandardMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.5} 
          />
        </mesh>
      )}
    </>
  );
}