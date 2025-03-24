
import { Canvas, useThree } from "@react-three/fiber";
import { useDroppable } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vector2, Vector3, Line3, Mesh } from "three";
import { SceneElements } from "./SceneElements";
import { SceneContent } from './SceneContent';
import { useToast } from '@/hooks/use-toast';
import { EditorPreferences } from '@/services/editor-preferences';
import firebaseMonitor from '@/services/firebase-monitor';
import { ConnectionType } from "@/types/connection";

interface SceneContainerProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections: Connection[];
  controlsRef: React.RefObject<any>;
  editorPreferences?: EditorPreferences | null;
  terrain?: TerrainData;
  readOnly?: boolean;
  onDropPoint?: (point: [number, number, number]) => void;
  gridSnap?: boolean;
  environmentalElements?: ElementType[];
  onStartConnection?: (moduleId: string, point: Vector3, type: ConnectionType) => void;
  onEndConnection?: (moduleId: string, point: Vector3, type: ConnectionType) => void;
  activeConnection?: { sourceModuleId: string; sourcePoint: Vector3; type: ConnectionType } | null;
}

export function SceneContainer({
  modules,
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  controlsRef,
  editorPreferences,
  terrain,
  readOnly = false,
  onDropPoint,
  gridSnap = false,
  environmentalElements = [],
  onStartConnection,
  onEndConnection,
  activeConnection
}: SceneContainerProps) {
  const { setNodeRef } = useDroppable({ id: 'scene' });
  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 60, memoryUsage: 0 });
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());

  // Scene content state
  const [mousePosition, setMousePosition] = useState<Vector2 | null>(null);
  const [draggedDimensions, setDraggedDimensions] = useState<{ length: number; width: number; height: number; } | null>(null);
  const [snapPoints, setSnapPoints] = useState<Vector3[]>([]);
  const [snapLines, setSnapLines] = useState<Line3[]>([]);
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  // Performance monitoring with safe memory check
  const monitorPerformance = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const fps = Math.round(1000 / deltaTime);
    
    let memoryUsage = 0;
    if (typeof window !== 'undefined' && window.performance) {
      try {
        const memory = (performance as any).memory;
        if (memory) {
          memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
        }
      } catch (error) {
        console.warn('Memory metrics not available:', error);
      }
    }

    setPerformanceMetrics({ fps, memoryUsage });
    lastTimeRef.current = currentTime;

    if (fps < 30 || memoryUsage > 80) {
      firebaseMonitor.logPerformanceMetric({
        fps,
        memoryUsage,
        operationDuration: deltaTime,
        timestamp: Date.now(),
        sceneObjects: modules.length + connections.length
      });
    }

    frameRef.current = requestAnimationFrame(monitorPerformance);
  }, [modules.length, connections.length]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(monitorPerformance);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [monitorPerformance]);

  const handlePreviewPositionUpdate = useCallback((position: [number, number, number]) => {
    setPreviewPosition(position);
    onDropPoint?.(position);
  }, [onDropPoint]);

  const handleTransformStart = useCallback(() => {
    setIsTransforming(true);
  }, []);

  const handleTransformEnd = useCallback(() => {
    setIsTransforming(false);
  }, []);

  return (
    <div ref={setNodeRef} className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <SceneContent
          modules={modules}
          selectedModuleId={selectedModuleId}
          transformMode={transformMode}
          onModuleSelect={onModuleSelect}
          onModuleUpdate={onModuleUpdate}
          onModuleDelete={onModuleDelete}
          connections={connections}
          controlsRef={controlsRef}
          editorPreferences={editorPreferences}
          mousePosition={mousePosition}
          draggedDimensions={draggedDimensions}
          snapPoints={snapPoints}
          snapLines={snapLines}
          onPreviewPositionUpdate={handlePreviewPositionUpdate}
          previewMesh={previewMesh}
          rotationAngle={rotationAngle}
          showGuides={showGuides}
          previewPosition={previewPosition}
          setRotationAngle={setRotationAngle}
          isTransforming={isTransforming}
          onTransformStart={handleTransformStart}
          onTransformEnd={handleTransformEnd}
          terrain={terrain}
          readOnly={readOnly}
          gridSnap={gridSnap}
          environmentalElements={environmentalElements}
        />
      </Canvas>

      {/* Performance Monitor */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs">
        <div className="flex items-center gap-2">
          <span>FPS: {performanceMetrics.fps}</span>
          <span>Memory: {Math.round(performanceMetrics.memoryUsage)}%</span>
        </div>
      </div>
    </div>
  );
}
