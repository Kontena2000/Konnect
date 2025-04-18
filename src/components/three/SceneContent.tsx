import { useThree } from "@react-three/fiber";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { Vector2, Vector3, Line3, Mesh } from "three";
import { SceneElements } from "./SceneElements";
import { EditorPreferences } from '@/services/editor-preferences';
import { CameraControls } from './CameraControls';

interface SceneContentProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections: Connection[];
  environmentalElements?: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  gridSnap?: boolean;
  isDraggingOver?: boolean;
  mousePosition: Vector2 | null;
  draggedDimensions: { length: number; width: number; height: number; } | null;
  readOnly?: boolean;
  snapPoints: Vector3[];
  snapLines: Line3[];
  onPreviewPositionUpdate: (position: [number, number, number]) => void;
  previewMesh: Mesh | null;
  rotationAngle: number;
  showGuides?: boolean;
  previewPosition: [number, number, number];
  setRotationAngle: (angle: number | ((prev: number) => number)) => void;
  controlsRef: React.RefObject<any>;
  isTransforming: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  editorPreferences?: EditorPreferences | null;
}

export function SceneContent({
  modules,
  selectedModuleId,
  transformMode,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  environmentalElements,
  terrain,
  onEnvironmentalElementSelect,
  gridSnap,
  isDraggingOver,
  mousePosition,
  draggedDimensions,
  readOnly,
  snapPoints,
  snapLines,
  onPreviewPositionUpdate,
  previewMesh,
  rotationAngle,
  showGuides,
  previewPosition,
  setRotationAngle,
  controlsRef,
  isTransforming,
  onTransformStart,
  onTransformEnd,
  editorPreferences,
}: SceneContentProps) {
  const { camera } = useThree();

  return (
    <>
      <CameraControls 
        controlsRef={controlsRef}
        enabled={!isTransforming}
      />
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
        isTransforming={isTransforming}
        onTransformStart={onTransformStart}
        onTransformEnd={onTransformEnd}
        editorPreferences={editorPreferences}
        controlsRef={controlsRef}
      />
    </>
  );
}