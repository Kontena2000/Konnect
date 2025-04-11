import { useThree } from "@react-three/fiber";
import { ModuleObject } from "./ModuleObject";
import { ConnectionLine } from "./ConnectionLine";
import { Module, ModuleDimensions } from "@/types/module";
import { Connection } from "@/services/layout";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Vector2, Vector3, Line3, Mesh, Object3D, BufferAttribute, BufferGeometry, LineBasicMaterial, Float32BufferAttribute, PlaneGeometry, MeshBasicMaterial } from "three";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import { GridHelper } from "./GridHelper";
import { CameraControls } from "./CameraControls";
import { Html, OrbitControls } from "@react-three/drei";
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
  setRotationAngle?: (angle: number) => void;
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
  transformMode = 'translate',
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections = [],
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  gridSnap = false,
  isDraggingOver = false,
  previewMesh,
  rotationAngle = 0,
  showGuides = false,
  snapPoints = [],
  snapLines = [],
  previewPosition,
  readOnly = false,
  setRotationAngle,
  isTransforming = false,
  onTransformStart,
  onTransformEnd,
  editorPreferences,
  controlsRef,
  draggedDimensions
}: SceneElementsProps) {
  const { scene, camera, gl } = useThree();
  const orbitControlsRef = useRef<any>(null);
  const groundRef = useRef<Mesh>(null);
  
  // Log dimensi yang di-drag untuk debugging
  useEffect(() => {
    if (draggedDimensions) {
      console.log('Dragged dimensions in SceneElements:', draggedDimensions);
    }
  }, [draggedDimensions]);

  // Set up orbit controls
  useEffect(() => {
    if (orbitControlsRef.current && controlsRef) {
      // Expose orbit controls methods to parent component
      if (controlsRef.current !== orbitControlsRef.current) {
        controlsRef.current = orbitControlsRef.current;
      }
    }
  }, [orbitControlsRef, controlsRef]);

  // Create ground plane for raycasting
  useEffect(() => {
    if (!groundRef.current) return;
    
    const geometry = new PlaneGeometry(1000, 1000);
    const material = new MeshBasicMaterial({ 
      visible: false,
      transparent: true,
      opacity: 0
    });
    
    groundRef.current.rotation.x = -Math.PI / 2;
    groundRef.current.position.y = 0;
    groundRef.current.updateMatrixWorld();
  }, []);

  // Handle keyboard events for orbit controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && isDraggingOver && setRotationAngle) {
        setRotationAngle(rotationAngle + Math.PI / 2);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDraggingOver, rotationAngle, setRotationAngle]);

  // Create preview mesh for dragging
  const previewBoxMesh = useMemo(() => {
    if (!isDraggingOver || !draggedDimensions) return null;
    
    // Pastikan dimensi valid
    const width = draggedDimensions.width || 1;
    const height = draggedDimensions.height || 1;
    const depth = draggedDimensions.depth || 1;
    
    console.log('Creating preview mesh with dimensions:', { width, height, depth });
    
    return (
      <mesh
        position={previewPosition || [0, height / 2, 0]}
        rotation={[0, rotationAngle || 0, 0]}
        castShadow
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={'#666666'} 
          transparent={true} 
          opacity={0.5} 
        />
      </mesh>
    );
  }, [isDraggingOver, previewPosition, rotationAngle, draggedDimensions]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      
      {/* Ground plane for raycasting */}
      <mesh ref={groundRef} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {/* Camera controls */}
      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        minDistance={2}
        maxDistance={100}
        enabled={!isTransforming}
      />
      
      {/* Modules */}
      {modules.map(module => (
        <ModuleObject
          key={module.id}
          module={module}
          modules={modules}
          selected={module.id === selectedModuleId}
          onClick={() => onModuleSelect?.(module.id)}
          onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          gridSnap={gridSnap}
          readOnly={readOnly}
          onTransformStart={onTransformStart}
          onTransformEnd={onTransformEnd}
          editorPreferences={editorPreferences}
        />
      ))}
      
      {/* Connections */}
      {connections.map((connection, index) => (
        <ConnectionLine
          key={`connection-${index}`}
          connection={connection}
          modules={modules}
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
      
      {/* Terrain */}
      {terrain && (
        <TerrainView terrain={terrain} />
      )}
      
      {/* Preview mesh for dragging */}
      {previewBoxMesh}
    </>
  );
}