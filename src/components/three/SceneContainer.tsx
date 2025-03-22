import { Canvas, useThree } from "@react-three/fiber";
import { useDroppable } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Vector2, Vector3, Box3, Line3 } from "three";
import { cn } from "@/lib/utils";
import { SceneElements } from "./SceneElements";
import { Html } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { SceneContent } from './SceneContent';

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
  isTransforming?: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}

export function SceneContainer({
  modules,
  selectedModuleId,
  transformMode = 'translate',
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
  gridSnap = true,
  isTransforming = false,
  onTransformStart,
  onTransformEnd
}: SceneContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'scene',
  });
  const [previewMesh, setPreviewMesh] = useState<THREE.Mesh | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const [mousePosition, setMousePosition] = useState<Vector2 | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [transforming, setTransforming] = useState(false);
  const controlsRef = useRef<any>(null);
  const draggedModuleRef = useRef<Module | null>(null);

  const handleModuleSelect = useCallback((moduleId?: string) => {
    if (isTransforming) return;
    if (moduleId) {
      onModuleSelect?.(moduleId);
    }
  }, [isTransforming, onModuleSelect]);

  const handleTransformStart = useCallback(() => {
    setTransforming(true);
    onTransformStart?.();
    
    // Lock camera controls
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [onTransformStart]);

  const handleTransformEnd = useCallback(() => {
    setTransforming(false);
    onTransformEnd?.();
    
    // Re-enable camera controls
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }, [onTransformEnd]);

  const { snapPoints, snapLines } = useMemo(() => {
    const points: Vector3[] = [];
    const lines: Line3[] = [];

    modules.forEach(currentModule => {
      const box = new Box3();
      const size = new Vector3(
        currentModule.dimensions.length,
        currentModule.dimensions.height,
        currentModule.dimensions.width
      );
      const position = new Vector3(...currentModule.position);
      box.setFromCenterAndSize(position, size);

      const corners = [
        new Vector3(box.min.x, 0, box.min.z),
        new Vector3(box.max.x, 0, box.min.z),
        new Vector3(box.min.x, 0, box.max.z),
        new Vector3(box.max.x, 0, box.max.z),
      ];
      points.push(...corners);

      corners.forEach((start, i) => {
        const end = corners[(i + 1) % 4];
        lines.push(new Line3(start, end));
      });
    });

    return { snapPoints: points, snapLines: lines };
  }, [modules]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (readOnly) return;
    event.preventDefault();
    setIsDraggingOver(true);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    setMousePosition(new Vector2(x, y));
  }, [readOnly]);

  const handleDragLeave = useCallback(() => {
    if (readOnly) return;
    setIsDraggingOver(false);
    setMousePosition(null);
  }, [readOnly]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (readOnly || !onDropPoint || !draggedModuleRef.current) return;
    event.preventDefault();
    
    // Calculate proper height based on module dimensions
    const moduleHeight = draggedModuleRef.current.dimensions.height;
    const properY = moduleHeight / 2; // Place bottom at ground level
    
    // Snap to grid with proper height
    const snappedPosition: [number, number, number] = [
      Math.round(previewPosition[0]),
      properY,
      Math.round(previewPosition[2])
    ];
    
    // Check for collisions before placement
    const previewBox = new Box3();
    const previewSize = new Vector3(
      draggedModuleRef.current.dimensions.length,
      draggedModuleRef.current.dimensions.height,
      draggedModuleRef.current.dimensions.width
    );
    const previewPos = new Vector3(...snappedPosition);
    previewBox.setFromCenterAndSize(previewPos, previewSize);
    
    let hasCollision = false;
    modules.forEach(existingModule => {
      const existingBox = new Box3();
      const existingPos = new Vector3(...existingModule.position);
      const existingSize = new Vector3(
        existingModule.dimensions.length,
        existingModule.dimensions.height,
        existingModule.dimensions.width
      );
      existingBox.setFromCenterAndSize(existingPos, existingSize);
      
      if (previewBox.intersectsBox(existingBox)) {
        hasCollision = true;
      }
    });
    
    if (!hasCollision) {
      onDropPoint(snappedPosition);
    }
    
    setIsDraggingOver(false);
    setMousePosition(null);
  }, [readOnly, onDropPoint, previewPosition, modules, draggedModuleRef]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (readOnly) return;
    if (event.key === "r") {
      setRotationAngle(prev => (prev + Math.PI / 2) % (Math.PI * 2));
    }
    if (event.shiftKey) {
      setShowGuides(true);
    }
  }, [readOnly]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (readOnly) return;
    if (event.key === "Shift") {
      setShowGuides(false);
    }
  }, [readOnly]);

  useEffect(() => {
    if (readOnly) return;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, readOnly]);

  useEffect(() => {
    if (!isDraggingOver || !draggedModuleRef.current) return;
    
    const currentModule = draggedModuleRef.current;
    const geometry = new THREE.BoxGeometry(
      currentModule.dimensions.length,
      currentModule.dimensions.height,
      currentModule.dimensions.width
    );
    
    // Create preview material with collision feedback
    const material = new THREE.MeshStandardMaterial({
      color: currentModule.color,
      transparent: true,
      opacity: 0.6,
      wireframe: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Check for collisions and update preview appearance
    const checkCollisions = () => {
      if (!mesh || !draggedModuleRef.current) return;
      
      const previewBox = new Box3();
      const previewSize = new Vector3(
        draggedModuleRef.current.dimensions.length,
        draggedModuleRef.current.dimensions.height,
        draggedModuleRef.current.dimensions.width
      );
      const previewPos = new Vector3(...previewPosition);
      previewBox.setFromCenterAndSize(previewPos, previewSize);
      
      let hasCollision = false;
      modules.forEach(existingModule => {
        const existingBox = new Box3();
        const existingPos = new Vector3(...existingModule.position);
        const existingSize = new Vector3(
          existingModule.dimensions.length,
          existingModule.dimensions.height,
          existingModule.dimensions.width
        );
        existingBox.setFromCenterAndSize(existingPos, existingSize);
        
        if (previewBox.intersectsBox(existingBox)) {
          hasCollision = true;
        }
      });
      
      if (material) {
        material.color.set(hasCollision ? '#ff0000' : currentModule.color);
        material.opacity = hasCollision ? 0.7 : 0.6;
      }
    };
    
    // Update collision check on position changes
    const intervalId = setInterval(checkCollisions, 100);
    
    setPreviewHeight(currentModule.dimensions.height);
    setPreviewMesh(mesh);
    
    return () => {
      clearInterval(intervalId);
      geometry.dispose();
      material.dispose();
      setPreviewMesh(null);
    };
  }, [isDraggingOver, previewPosition, modules]);

  const handleModuleDragStart = useCallback((draggedModule: Module) => {
    draggedModuleRef.current = draggedModule;
    setPreviewHeight(draggedModule.dimensions.height);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).handleModuleDragStart = handleModuleDragStart;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).handleModuleDragStart;
      }
    };
  }, [handleModuleDragStart]);

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        'w-full h-full relative',
        !readOnly && isOver && 'cursor-crosshair'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Canvas 
        camera={{ 
          position: [10, 10, 10], 
          zoom: cameraZoom,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        <SceneContent
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
          mousePosition={mousePosition}
          draggedDimensions={draggedModuleRef.current?.dimensions || null}
          readOnly={readOnly}
          snapPoints={snapPoints}
          snapLines={snapLines}
          onPreviewPositionUpdate={setPreviewPosition}
          previewMesh={previewMesh}
          rotationAngle={rotationAngle}
          showGuides={showGuides}
          previewPosition={previewPosition}
          setRotationAngle={setRotationAngle}
          controlsRef={controlsRef}
          isTransforming={transforming}
          onTransformStart={handleTransformStart}
          onTransformEnd={handleTransformEnd}
        />
      </Canvas>

      {isDraggingOver && previewMesh && (
        <>
          <group position={previewPosition} rotation={[0, rotationAngle, 0]}>
            <primitive object={previewMesh.clone()} />
            <mesh 
              position={[0, 0.01, 0]} 
              rotation={[-Math.PI/2, 0, 0]}
            >
              <planeGeometry args={[
                draggedModuleRef.current?.dimensions.length || 1,
                draggedModuleRef.current?.dimensions.width || 1
              ]} />
              <meshBasicMaterial 
                color='#000000'
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </>
      )}

      {!readOnly && isDraggingOver && (
        <div className='absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg space-y-2'>
          <div className='flex items-center gap-2'>
            <kbd className='px-2 py-1 bg-muted rounded text-xs'>R</kbd>
            <span className='text-sm'>Rotate module</span>
          </div>
          <div className='flex items-center gap-2'>
            <kbd className='px-2 py-1 bg-muted rounded text-xs'>Shift</kbd>
            <span className='text-sm'>Show alignment guides</span>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <span className='text-xs text-muted-foreground'>Position: {previewPosition[0].toFixed(1)}, {previewPosition[2].toFixed(1)}</span>
          </div>
        </div>
      )}

      <div className='absolute top-40 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg'>
        <div className='flex gap-1'>
          <Button 
            variant='outline' 
            size='sm'
            onClick={() => {
              if (controlsRef?.current) {
                controlsRef.current.reset();
              }
            }}
          >
            Top
          </Button>
          <Button 
            variant='outline' 
            size='sm'
            onClick={() => {
              if (controlsRef?.current) {
                controlsRef.current.setAzimuthalAngle(Math.PI / 4);
                controlsRef.current.setPolarAngle(Math.PI / 4);
              }
            }}
          >
            Isometric
          </Button>
        </div>
      </div>
    </div>
  );
}