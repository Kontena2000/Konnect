import { Canvas } from "@react-three/fiber";
import { useDroppable } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useCallback, useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { Vector2, Vector3, Box3, Line3 } from "three";
import { cn } from "@/lib/utils";
import { SceneContent } from './SceneContent';
import { useToast } from '@/hooks/use-toast';
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Button } from "@/components/ui/button";

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
  const { toast } = useToast();
  const { setNodeRef, isOver } = useDroppable({ id: 'scene' });
  const [previewMesh, setPreviewMesh] = useState<THREE.Mesh | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showGuides, setShowGuides] = useState(false);
  const [mousePosition, setMousePosition] = useState<Vector2 | null>(null);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [transforming, setTransforming] = useState(false);
  const controlsRef = useRef<any>(null);
  const draggedModuleRef = useRef<Module | null>(null);

  // Add ref to orbit controls
  const orbitControlsRef = useRef<any>(null);

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
    
    onDropPoint(previewPosition);
    setIsDraggingOver(false);
    setMousePosition(null);
  }, [readOnly, onDropPoint, previewPosition]);

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
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[10, 10, 10]}
          zoom={cameraZoom}
          near={0.1}
          far={1000}
        />
        
        <OrbitControls
          ref={orbitControlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

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
          snapPoints={[]}
          snapLines={[]}
          onPreviewPositionUpdate={setPreviewPosition}
          previewMesh={previewMesh}
          rotationAngle={rotationAngle}
          showGuides={showGuides}
          previewPosition={previewPosition}
          setRotationAngle={setRotationAngle}
          controlsRef={orbitControlsRef}
          isTransforming={transforming}
          onTransformStart={onTransformStart}
          onTransformEnd={onTransformEnd}
        />

        <gridHelper args={[100, 100]} />
      </Canvas>

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