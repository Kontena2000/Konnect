import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrthographicCamera, Vector2, Vector3, Raycaster, Mesh, Box3 } from 'three';
import { Module } from '@/types/module';
import { Connection } from '@/services/layout';
import { ConnectionType } from '@/types/connection';
import { ModuleObject } from './ModuleObject';
import { ConnectionLine } from './ConnectionLine';
import { EnvironmentalElement as ElementType, TerrainData } from '@/services/environment';
import { EnvironmentalElement } from '@/components/environment/EnvironmentalElement';
import { TerrainView } from '@/components/environment/TerrainView';
import { EditorPreferences } from '@/services/editor-preferences';
import { SceneElements } from './SceneElements';

interface SceneContentProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: 'translate' | 'rotate' | 'scale';
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections?: Connection[];
  environmentalElements?: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  gridSnap?: boolean;
  isDraggingOver?: boolean;
  mousePosition?: Vector2 | null;
  draggedDimensions?: {
    width: number;
    height: number;
    depth: number;
  } | null;
  readOnly?: boolean;
  snapPoints?: Vector3[];
  snapLines?: any[];
  onPreviewPositionUpdate?: (position: [number, number, number]) => void;
  previewMesh?: Mesh | null;
  rotationAngle?: number;
  showGuides?: boolean;
  previewPosition?: [number, number, number];
  setRotationAngle?: (angle: number) => void;
  controlsRef?: React.RefObject<any>;
  isTransforming?: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  editorPreferences?: EditorPreferences | null;
}

export function SceneContent({
  modules,
  selectedModuleId,
  transformMode = 'translate',
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections = [],
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  gridSnap = false,
  isDraggingOver = false,
  mousePosition,
  draggedDimensions,
  readOnly = false,
  snapPoints = [],
  snapLines = [],
  onPreviewPositionUpdate,
  previewMesh,
  rotationAngle = 0,
  showGuides = false,
  previewPosition,
  setRotationAngle,
  controlsRef,
  isTransforming = false,
  onTransformStart,
  onTransformEnd,
  editorPreferences
}: SceneContentProps) {
  const { scene, camera, gl } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const groundPlane = useMemo(() => new Mesh(), []);
  
  // Tambahkan log untuk melihat dimensi yang di-drag
  useEffect(() => {
    if (draggedDimensions) {
      console.log('Dragged dimensions in SceneContent:', draggedDimensions);
    }
  }, [draggedDimensions]);

  // Gunakan dimensi yang benar untuk preview
  useEffect(() => {
    if (isDraggingOver && mousePosition && draggedDimensions) {
      raycaster.setFromCamera(mousePosition, camera);
      const intersects = raycaster.intersectObject(groundPlane);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Gunakan dimensi yang benar dari draggedDimensions
        const height = draggedDimensions.height || 1;
        console.log('Using height for preview position:', height);
        
        const position: [number, number, number] = [
          Math.round(point.x),
          height / 2, // Posisi y yang benar berdasarkan tinggi modul
          Math.round(point.z)
        ];
        
        console.log('Setting preview position:', position);
        onPreviewPositionUpdate?.(position);
      }
    }
  }, [isDraggingOver, mousePosition, camera, raycaster, groundPlane, onPreviewPositionUpdate, draggedDimensions]);

  return (
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
      draggedDimensions={draggedDimensions}
    />
  );
}