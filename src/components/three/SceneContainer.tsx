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
  onModuleSelect?: (moduleId: string | undefined) => void;
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
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<CameraControlsHandle>(null);
  const {
    previewMesh,
    previewPosition,
    setPreviewPosition,
    handleDragStart,
    handleDragEnd,
    updatePreviewPosition
  } = useDragPreview();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const draggedModuleRef = useRef<Module | null>(null);

  // Handle background click to deselect
  const handleBackgroundClick = useCallback((event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (onModuleSelect) {
      onModuleSelect(undefined);
    }
  }, [onModuleSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (readOnly || !cameraRef.current) return;
    event.preventDefault();
    setIsDraggingOver(true);
    updatePreviewPosition(event, cameraRef.current, gridSnap ? 1 : 0.5);
  }, [readOnly, gridSnap, updatePreviewPosition]);

  const handleDragLeave = useCallback(() => {
    if (readOnly) return;
    setIsDraggingOver(false);
  }, [readOnly]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (readOnly || !onDropPoint || !previewMesh) return;
    event.preventDefault();
    
    // Calculate drop position with bottom at ground level
    const dropPosition: [number, number, number] = [
      previewPosition[0],
      0, // Place at ground level
      previewPosition[2]
    ];
    
    onDropPoint(dropPosition);
    setIsDraggingOver(false);
    handleDragEnd();
  }, [readOnly, onDropPoint, previewPosition, previewMesh, handleDragEnd]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (readOnly) return;
    if (event.key === "r") {
      setRotationAngle(prev => (prev + Math.PI / 2) % (Math.PI * 2));
    }
    if (event.shiftKey) {
      setShowGuides(true);
    }
    if (event.key === "Escape" && onModuleSelect) {
      onModuleSelect(undefined);
    }
  }, [readOnly, onModuleSelect]);

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

  // Lock camera when module is selected
  useEffect(() => {
    if (controlsRef.current) {
      if (selectedModuleId) {
        controlsRef.current.saveState();
      } else {
        controlsRef.current.reset();
      }
    }
  }, [selectedModuleId]);

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
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
        onClick={handleBackgroundClick}
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
          snapPoints={[]}
          snapLines={[]}
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
          <div className='flex items-center gap-2'>
            <kbd className='px-2 py-1 bg-muted rounded text-xs'>Esc</kbd>
            <span className='text-sm'>Deselect module</span>
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