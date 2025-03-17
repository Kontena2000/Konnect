
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { useDroppable } from "@dnd-kit/core";
import { ConnectionLine } from "./ConnectionLine";
import { Connection } from "@/services/layout";
import { Module } from "@/types/module";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import { useCallback, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Plane, Line3, Box3 } from 'three';
import { cn } from '@/lib/utils';

interface SceneProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections: Connection[];
  environmentalElements: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  gridSnap: boolean;
  isDraggingOver: boolean;
  previewMesh: THREE.Mesh | null;
  rotationAngle: number;
  showGuides: boolean;
  snapPoints: Vector3[];
  snapLines: Line3[];
  previewHeight: number;
  mousePosition: Vector2 | null;
  onDropPoint: (point: [number, number, number]) => void;
}

function Scene({
  modules,
  selectedModuleId,
  transformMode,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  environmentalElements,
  terrain,
  onEnvironmentalElementSelect,
  gridSnap,
  isDraggingOver,
  previewMesh,
  rotationAngle,
  showGuides,
  snapPoints,
  snapLines,
  previewHeight,
  mousePosition,
  onDropPoint
}: SceneProps) {
  const { scene, camera } = useThree();

  useEffect(() => {
    if (isDraggingOver && mousePosition && previewMesh) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (mousePosition.x / window.innerWidth) * 2 - 1,
        -(mousePosition.y / window.innerHeight) * 2 + 1
      );
      
      raycaster.setFromCamera(mouse, camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersection);

      if (gridSnap) {
        // Find nearest snap point if close enough
        const snapThreshold = 1.5;
        const nearestPoint = snapPoints.reduce((nearest, point) => {
          const distance = intersection.distanceTo(point);
          return distance < snapThreshold && distance < nearest.distance
            ? { point, distance }
            : nearest;
        }, { point: intersection, distance: Infinity });

        intersection.copy(nearestPoint.point);
      } else {
        intersection.x = Math.round(intersection.x * 2) / 2;
        intersection.z = Math.round(intersection.z * 2) / 2;
      }

      previewMesh.position.set(
        intersection.x,
        previewHeight / 2,
        intersection.z
      );
      previewMesh.rotation.set(0, rotationAngle, 0);
    }
  }, [isDraggingOver, mousePosition, previewMesh, camera, gridSnap, snapPoints, previewHeight, rotationAngle]);

  return (
    <>
      <OrbitControls makeDefault enabled={!isDraggingOver} />
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5}
        cellSize={gridSnap ? 1 : 0.5}
        cellThickness={gridSnap ? 1 : 0.5}
        cellColor={isDraggingOver ? '#2563eb' : '#94a3b8'}
        sectionSize={gridSnap ? 10 : 5}
      />
      <Environment preset='city' />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
      />

      {modules.map((module) => (
        <ModuleObject
          key={module.id}
          module={module}
          selected={module.id === selectedModuleId}
          onSelect={() => onModuleSelect?.(module.id)}
          onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          gridSnap={gridSnap}
          castShadow
          receiveShadow
        />
      ))}

      {connections.map((connection) => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          selected={false}
        />
      ))}

      {environmentalElements.map((element) => (
        <EnvironmentalElement
          key={element.id}
          element={element}
          onSelect={() => onEnvironmentalElementSelect?.(element.id)}
        />
      ))}

      {terrain && <TerrainView data={terrain} />}

      {previewMesh && isDraggingOver && (
        <primitive 
          object={previewMesh} 
          position={[0, previewHeight / 2, 0]}
          rotation={[0, rotationAngle, 0]}
          castShadow
          receiveShadow
        />
      )}

      {showGuides && isDraggingOver && (
        <group>
          <gridHelper 
            args={[100, 100, '#2563eb', '#2563eb']}
            position={[0, 0.01, 0]}
          />
          <axesHelper args={[5]} />
          
          {snapPoints.map((point, index) => (
            <mesh key={`snap-point-${index}`} position={point}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#2563eb" transparent opacity={0.5} />
            </mesh>
          ))}

          {snapLines.map((line, index) => (
            <line key={`snap-line-${index}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    line.start.x, line.start.y, line.start.z,
                    line.end.x, line.end.y, line.end.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#2563eb" linewidth={1} />
            </line>
          ))}
        </group>
      )}
    </>
  );
}

export interface SceneContainerProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  onDropPoint?: (point: [number, number, number]) => void;
  connections?: Connection[];
  activeConnection?: {
    sourceModuleId: string;
    sourcePoint: [number, number, number];
    type: ConnectionType;
  } | null;
  onConnectPoint?: (moduleId: string, point: [number, number, number], type: ConnectionType) => void;
  readOnly?: boolean;
  environmentalElements?: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  cameraZoom?: number;
  gridSnap?: boolean;
}

export function SceneContainer({
  modules,
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  onDropPoint,
  connections = [],
  activeConnection,
  onConnectPoint,
  readOnly = false,
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  cameraZoom = 1,
  gridSnap = true
}: SceneContainerProps) {
  const { setNodeRef } = useDroppable({ id: "scene" });
  const [previewMesh, setPreviewMesh] = useState<THREE.Mesh | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const [mousePosition, setMousePosition] = useState<Vector2 | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);

  // Calculate snap points and lines from existing modules
  const { snapPoints, snapLines } = useMemo(() => {
    const points: Vector3[] = [];
    const lines: Line3[] = [];

    modules.forEach(module => {
      const box = new Box3();
      const size = new Vector3(
        module.dimensions.length,
        module.dimensions.height,
        module.dimensions.width
      );
      const position = new Vector3(...module.position);
      box.setFromCenterAndSize(position, size);

      // Add bottom corners as snap points
      const corners = [
        new Vector3(box.min.x, 0, box.min.z),
        new Vector3(box.max.x, 0, box.min.z),
        new Vector3(box.min.x, 0, box.max.z),
        new Vector3(box.max.x, 0, box.max.z),
      ];
      points.push(...corners);

      // Add edges as snap lines
      corners.forEach((start, i) => {
        const end = corners[(i + 1) % 4];
        lines.push(new Line3(start, end));
      });
    });

    return { snapPoints: points, snapLines: lines };
  }, [modules]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(true);
    setMousePosition(new Vector2(event.clientX, event.clientY));
  }, []);

  const handleDragLeave = () => {
    setIsDraggingOver(false);
    setMousePosition(null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (!mousePosition) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new Vector2(x, y), new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000));

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);

    if (gridSnap) {
      const snapThreshold = 1.5;
      const nearestPoint = snapPoints.reduce((nearest, point) => {
        const distance = intersection.distanceTo(point);
        return distance < snapThreshold && distance < nearest.distance
          ? { point, distance }
          : nearest;
      }, { point: intersection, distance: Infinity });

      intersection.copy(nearestPoint.point);
    } else {
      intersection.x = Math.round(intersection.x * 2) / 2;
      intersection.z = Math.round(intersection.z * 2) / 2;
    }

    onDropPoint?.([intersection.x, previewHeight / 2, intersection.z]);
    setIsDraggingOver(false);
    setMousePosition(null);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'r') {
      setRotationAngle(prev => (prev + Math.PI / 2) % (Math.PI * 2));
    }
    if (event.shiftKey) {
      setShowGuides(true);
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      setShowGuides(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        'w-full h-full relative',
        isDraggingOver && 'cursor-crosshair'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Canvas camera={{ position: [10, 10, 10], zoom: cameraZoom }}>
        <Scene 
          modules={modules}
          selectedModuleId={selectedModuleId}
          transformMode={transformMode}
          onModuleSelect={onModuleSelect}
          onModuleUpdate={onModuleUpdate}
          onModuleDelete={onModuleDelete}
          connections={connections}
          environmentalElements={environmentalElements}
          terrain={terrain}
          onEnvironmentalElementSelect={onEnvironmentalElementSelect}
          gridSnap={gridSnap}
          isDraggingOver={isDraggingOver}
          previewMesh={previewMesh}
          rotationAngle={rotationAngle}
          showGuides={showGuides}
          snapPoints={snapPoints}
          snapLines={snapLines}
          previewHeight={previewHeight}
          mousePosition={mousePosition}
          onDropPoint={onDropPoint}
        />
      </Canvas>

      {isDraggingOver && (
        <div className='absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg'>
          <p className='text-sm'>Press R to rotate</p>
          <p className='text-xs text-muted-foreground'>Hold Shift for guides</p>
        </div>
      )}
    </div>
  );
}
