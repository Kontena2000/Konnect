
import { Canvas } from "@react-three/fiber";
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
import { CameraControlsHandle } from './CameraControls';
import { useGridSnapping } from '@/hooks/use-grid-snapping';
import { useDragPreview } from '@/hooks/use-drag-preview';

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
  const {
    previewMesh,
    previewPosition,
    setPreviewPosition,
    handleDragStart,
    handleDragEnd
  } = useDragPreview();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const [mousePosition, setMousePosition] = useState<Vector2 | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);
  const controlsRef = useRef<CameraControlsHandle>(null);
  const draggedModuleRef = useRef<Module | null>(null);

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

  const handleModuleDragStart = useCallback((module: Module) => {
    handleDragStart(module);
    setPreviewHeight(module.dimensions.height);
    draggedModuleRef.current = module;
  }, [handleDragStart]);

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
    if (readOnly || !onDropPoint) return;
    event.preventDefault();
    
    onDropPoint(previewPosition);
    setIsDraggingOver(false);
    setMousePosition(null);
    handleDragEnd();
  }, [readOnly, onDropPoint, previewPosition, handleDragEnd]);

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
        "w-full h-full relative",
        !readOnly && isDraggingOver && "cursor-crosshair"
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
        <SceneElements
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
          previewPosition={previewPosition}
          readOnly={readOnly}
          setRotationAngle={setRotationAngle}
          controlsRef={controlsRef}
        />
      </Canvas>

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

      <div className='absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg'>
        <div className='flex gap-1'>
          <Button 
            variant='outline' 
            size='sm'
            onClick={() => {
              if (controlsRef?.current) {
                controlsRef.current.setAzimuthalAngle(0);
                controlsRef.current.setPolarAngle(0);
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
