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
import { useToast } from '@/hooks/use-toast';
import { GridPreferences } from '@/services/grid-preferences';
import { GridHelper } from './GridHelper';

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
  gridPreferences?: GridPreferences | null;
  controlsRef?: React.RefObject<any>;
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
  onTransformEnd,
  gridPreferences,
  controlsRef
}: SceneContainerProps) {
  const { toast } = useToast();
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
    
    // Get cursor position in normalized device coordinates (-1 to +1)
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
    
    const moduleHeight = draggedModuleRef.current.dimensions.height;
    const properY = moduleHeight / 2;
    
    // Use the actual preview position for placement
    const snappedPosition: [number, number, number] = [
      previewPosition[0],
      properY,
      previewPosition[2]
    ];
    
    // Check for collisions with minimal buffer
    const BUFFER = 0.0001; // 0.1mm buffer
    const previewBox = new Box3();
    const previewSize = new Vector3(
      draggedModuleRef.current.dimensions.length + BUFFER,
      draggedModuleRef.current.dimensions.height + BUFFER,
      draggedModuleRef.current.dimensions.width + BUFFER
    );
    const previewPos = new Vector3(...snappedPosition);
    previewBox.setFromCenterAndSize(previewPos, previewSize);
    
    let hasCollision = false;
    modules.forEach(existingModule => {
      const existingBox = new Box3();
      const existingSize = new Vector3(
        existingModule.dimensions.length + BUFFER,
        existingModule.dimensions.height + BUFFER,
        existingModule.dimensions.width + BUFFER
      );
      const existingPos = new Vector3(...existingModule.position);
      existingBox.setFromCenterAndSize(existingPos, existingSize);
      
      if (previewBox.intersectsBox(existingBox)) {
        hasCollision = true;
      }
    });
    
    if (!hasCollision) {
      onDropPoint(snappedPosition);
    } else {
      toast({
        variant: 'destructive',
        title: 'Cannot place module',
        description: 'Objects cannot overlap with each other'
      });
    }
    
    setIsDraggingOver(false);
    setMousePosition(null);
  }, [readOnly, onDropPoint, previewPosition, modules, draggedModuleRef, toast]);

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
    
    const material = new THREE.MeshStandardMaterial({
      color: currentModule.color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Update shadow direction based on rotation
    mesh.updateMatrixWorld(true);
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.updateMatrixWorld(true);
      }
    });
    
    setPreviewMesh(mesh);
    
    return () => {
      geometry.dispose();
      material.dispose();
      setPreviewMesh(null);
    };
  }, [isDraggingOver, draggedModuleRef.current]);

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
        !readOnly && isOver && 'cursor-none'
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
        shadows={{
          enabled: true,
          type: THREE.PCFSoftShadowMap,
          autoUpdate: true
        }}
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
        <GridHelper
          showAxes={true}
          preferences={gridPreferences}
        />
      </Canvas>

      {/* Keep only the drag overlay and keyboard shortcuts info */}
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
    </div>
  );
}