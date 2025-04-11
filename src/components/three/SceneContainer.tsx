import { Canvas, useThree } from "@react-three/fiber";
import { useDroppable } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Vector2, Vector3, Box3, Line3, Material, Mesh } from "three";
import { cn } from "@/lib/utils";
import { SceneElements } from "./SceneElements";
import { Html } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { SceneContent } from './SceneContent';
import { useToast } from '@/hooks/use-toast';
import { GridHelper } from './GridHelper';
import { EditorPreferences } from '@/services/editor-preferences';
import firebaseMonitor from '@/services/firebase-monitor';

const getPerformanceMetrics = () => {
  const metrics = {
    memory: 0,
    fps: 0
  };

  // Safe check for Chrome's memory API
  const performance = window.performance as any;
  if (performance && performance.memory) {
    metrics.memory = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
  }

  return metrics;
};

// Add safe resource disposal utility
const disposeObject = (obj: THREE.Object3D | null) => {
  if (!obj) return;
  
  // Dispose geometries
  if (obj instanceof Mesh && obj.geometry) {
    obj.geometry.dispose();
  }
  
  // Safely dispose materials
  if (obj instanceof Mesh) {
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach(material => {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    });
  }
  
  // Recursively dispose children
  obj.children.forEach(child => disposeObject(child));
};

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
  gridSnap = false,
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
  const frameCount = useRef(0);
  const lastFpsCheck = useRef(Date.now());
  const animationFrameId = useRef<number>();

  // Optimized frame rate monitoring with safe memory checks
  useEffect(() => {
    const checkPerformance = () => {
      const now = Date.now();
      const elapsedTime = now - lastFpsCheck.current;
      
      if (elapsedTime >= 1000) { // Check every second
        const fps = Math.round((frameCount.current / elapsedTime) * 1000);
        const metrics = getPerformanceMetrics();
        
        firebaseMonitor.logPerformanceMetric({
          fps,
          timestamp: now,
          memoryUsage: metrics.memory
        });
        
        frameCount.current = 0;
        lastFpsCheck.current = now;
      }
      
      frameCount.current++;
      animationFrameId.current = requestAnimationFrame(checkPerformance);
    };

    animationFrameId.current = requestAnimationFrame(checkPerformance);

    // Cleanup function to prevent memory leaks
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Clear any references
      frameCount.current = 0;
      lastFpsCheck.current = 0;
    };
  }, []);

  const handleFrame = useCallback(() => {
    frameCount.current++;
  }, []);

  // Memoize expensive computations
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
      // Use width, height, depth instead of length for type safety
      const width = module.dimensions.width || 1;
      const height = module.dimensions.height || 1;
      const depth = module.dimensions.depth || 1;
      
      const box = new Box3().setFromCenterAndSize(
        pos,
        new Vector3(width, height, depth)
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

  // Enhanced cleanup with safe disposal
  const cleanupRefs = useCallback(() => {
    if (previewMesh) {
      disposeObject(previewMesh);
      setPreviewMesh(null);
    }
  }, [previewMesh]);

  // Monitor scene performance
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const monitorPerformance = () => {
      frames++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frames * 1000) / elapsed);
        const metrics = getPerformanceMetrics();
        
        firebaseMonitor.logPerformanceMetric({
          fps,
          timestamp: currentTime,
          memoryUsage: metrics.memory,
          operationDuration: elapsed
        });

        frames = 0;
        lastTime = currentTime;
      }

      frameId = requestAnimationFrame(monitorPerformance);
    };

    frameId = requestAnimationFrame(monitorPerformance);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      cleanupRefs();
    };
  }, [cleanupRefs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRefs();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [cleanupRefs]);

  // Add a console log to debug the editor preferences
  useEffect(() => {
    console.log('Editor preferences in SceneContainer:', editorPreferences);
  }, [editorPreferences]);

  return (
    <div 
      ref={setNodeRef} 
      className='w-full h-full'
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Canvas 
        onCreated={handleFrame}
        style={{ width: '100%', height: '100%' }}
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
        {/* Force the grid to be visible by providing default preferences if none exist */}
        <GridHelper
          showAxes={true}
          preferences={editorPreferences?.grid || {
            size: 50,
            weight: '1',
            color: '#888888',
            visible: true,
            showAxes: true,
            snap: true,
            divisions: 5
          }}
        />
      </Canvas>

      {!readOnly && isDraggingOver && (
        <div className='absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg space-y-2 z-10'>
          <div className='flex items-center gap-2'>
            <kbd className='px-2 py-1 bg-muted rounded text-xs'>R</kbd>
            <span className='text-sm'>Rotate module</span>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <span className='text-xs text-muted-foreground'>Position: {previewPosition[0].toFixed(1)}, {previewPosition[2].toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}