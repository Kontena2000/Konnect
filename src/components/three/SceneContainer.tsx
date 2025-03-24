
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

interface SceneContainerProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode: "translate" | "rotate" | "scale";
  onModuleSelect: (moduleId: string) => void;
  onModuleUpdate: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete: (moduleId: string) => void;
  connections: Connection[];
  controlsRef: React.RefObject<any>;
  editorPreferences: EditorPreferences | null;
}

export function SceneContainer({
  modules,
  selectedModuleId,
  transformMode,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  controlsRef,
  editorPreferences
}: SceneContainerProps) {
  const { setNodeRef } = useDroppable({ id: 'scene' });
  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 60, memoryUsage: 0 });
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());

  // Additional state for SceneContent props
  const [mousePosition, setMousePosition] = useState<Vector2 | null>(null);
  const [draggedDimensions, setDraggedDimensions] = useState<{ length: number; width: number; height: number; } | null>(null);
  const [snapPoints, setSnapPoints] = useState<Vector3[]>([]);
  const [snapLines, setSnapLines] = useState<Line3[]>([]);
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const fps = Math.round(1000 / deltaTime);
    
    let memoryUsage = 0;
    try {
      if (typeof window !== 'undefined' && 
          window.performance && 
          (performance as any).memory) {
        memoryUsage = ((performance as any).memory.usedJSHeapSize / 
                       (performance as any).memory.jsHeapSizeLimit) * 100;
      }
    } catch (error) {
      console.error('Error monitoring memory:', error);
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
  }, []);

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
