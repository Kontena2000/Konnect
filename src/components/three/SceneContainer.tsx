
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
import { GridHelper } from './GridHelper';
import { EditorPreferences } from '@/services/editor-preferences';

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
  editorPreferences?: EditorPreferences | null;
  controlsRef: React.RefObject<any>;
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
  editorPreferences,
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

  const snapPoints = useMemo(() => {
    return modules.reduce((points: Vector3[], module) => {
      const pos = new Vector3(...module.position);
      points.push(pos);
      return points;
    }, []);
  }, [modules]);

  const snapLines = useMemo(() => {
    return modules.reduce((lines: Line3[], module) => {
      const pos = new Vector3(...module.position);
      const box = new Box3().setFromCenterAndSize(
        pos,
        new Vector3(module.dimensions.length, module.dimensions.height, module.dimensions.width)
      );
      lines.push(
        new Line3(box.min, new Vector3(box.min.x, box.min.y, box.max.z)),
        new Line3(box.min, new Vector3(box.max.x, box.min.y, box.min.z)),
        new Line3(box.max, new Vector3(box.min.x, box.max.y, box.max.z)),
        new Line3(box.max, new Vector3(box.max.x, box.min.y, box.max.z))
      );
      return lines;
    }, []);
  }, [modules]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(true);
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition(new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    ));
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
    setMousePosition(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
    setMousePosition(null);
    if (previewPosition && onDropPoint) {
      onDropPoint(previewPosition);
    }
  }, [previewPosition, onDropPoint]);

  const handleTransformStart = useCallback(() => {
    setTransforming(true);
    onTransformStart?.();
  }, [onTransformStart]);

  const handleTransformEnd = useCallback(() => {
    setTransforming(false);
    onTransformEnd?.();
  }, [onTransformEnd]);

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
          editorPreferences={editorPreferences}
        />
        <GridHelper
          showAxes={true}
          preferences={editorPreferences?.grid}
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
    </div>
  );
}
