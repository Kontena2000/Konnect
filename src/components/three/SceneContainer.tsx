
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

  // Rest of the component implementation remains the same...
  // Only showing the changed parts for brevity

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
