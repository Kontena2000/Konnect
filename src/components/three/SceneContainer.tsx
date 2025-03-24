
import { Canvas } from "@react-three/fiber";
import { useDroppable } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { useCallback, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { SceneContent } from './SceneContent';
import { EditorPreferences } from '@/services/editor-preferences';
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
  readOnly?: boolean;
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
  readOnly = false,
  onStartConnection,
  onEndConnection,
  activeConnection
}: SceneContainerProps) {
  const { setNodeRef } = useDroppable({ id: 'scene' });
  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 60, memoryUsage: 0 });
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const fps = Math.round(1000 / deltaTime);
    
    setPerformanceMetrics({ fps, memoryUsage: 0 }); // Simplified for MVP
    lastTimeRef.current = currentTime;

    frameRef.current = requestAnimationFrame(monitorPerformance);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(monitorPerformance);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [monitorPerformance]);

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
          readOnly={readOnly}
          showGuides={!readOnly}
          isTransforming={false}
        />
      </Canvas>

      {/* Performance Monitor */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs">
        <div className="flex items-center gap-2">
          <span>FPS: {performanceMetrics.fps}</span>
        </div>
      </div>
    </div>
  );
}
