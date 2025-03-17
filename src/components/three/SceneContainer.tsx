import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, TransformControls } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { useDroppable } from "@dnd-kit/core";
import { ConnectionLine } from "./ConnectionLine";
import { Connection } from "@/services/layout";
import { Module } from "@/types/module";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import { useThree } from '@react-three/fiber';
import { useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Plane, Mesh, MeshStandardMaterial, BoxGeometry } from 'three';
import { cn } from '@/lib/utils';

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
  const { setNodeRef } = useDroppable({
    id: "scene"
  });

  const { camera, raycaster, scene } = useThree();
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showGuides, setShowGuides] = useState(false);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const mousePos = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycaster.setFromCamera(mousePos, camera);
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    const intersection = new Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);
    
    if (gridSnap) {
      intersection.x = Math.round(intersection.x);
      intersection.z = Math.round(intersection.z);
    }
    
    onDropPoint?.([intersection.x, 0, intersection.z]);
  }, [camera, raycaster, gridSnap, onDropPoint]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(true);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const mousePos = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycaster.setFromCamera(mousePos, camera);
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
    const intersection = new Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);
    
    if (gridSnap) {
      intersection.x = Math.round(intersection.x);
      intersection.z = Math.round(intersection.z);
    }
    
    if (previewMesh) {
      previewMesh.position.set(intersection.x, 0, intersection.z);
      
      // Enhanced visual feedback for grid snapping
      if (gridSnap) {
        const gridPosition = new Vector3(
          Math.round(intersection.x),
          0,
          Math.round(intersection.z)
        );
        previewMesh.position.copy(gridPosition);
        
        // Add a subtle animation to show snapping
        previewMesh.scale.setScalar(0.98);
        setTimeout(() => {
          if (previewMesh) {
            previewMesh.scale.setScalar(1);
          }
        }, 150);
      }
    }
  }, [camera, raycaster, gridSnap, previewMesh]);

  const handleDragLeave = () => {
    setIsDraggingOver(false);
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

        {/* Preview mesh for dragging */}
        {previewMesh && (
          <primitive 
            object={previewMesh} 
            rotation={[0, rotationAngle, 0]}
            castShadow
            receiveShadow
          />
        )}

        {/* Alignment guides */}
        {showGuides && isDraggingOver && (
          <group>
            <gridHelper 
              args={[100, 100, '#2563eb', '#2563eb']}
              position={[0, 0.01, 0]}
            />
            <axesHelper args={[5]} />
          </group>
        )}

        {modules.map((module) => (
          <ModuleObject
            key={module.id}
            module={module}
            selected={module.id === selectedModuleId}
            onSelect={() => onModuleSelect?.(module.id)}
            onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
            onDelete={() => onModuleDelete?.(module.id)}
            transformMode={transformMode}
            readOnly={readOnly}
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
      </Canvas>

      {/* Rotation indicator */}
      {isDraggingOver && (
        <div className='absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg'>
          <p className='text-sm'>Press R to rotate</p>
          <p className='text-xs text-muted-foreground'>Hold Shift for guides</p>
        </div>
      )}
    </div>
  );
}