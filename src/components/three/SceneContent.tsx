
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { SceneElements } from "./SceneElements";
import { EditorPreferences } from '@/services/editor-preferences';

interface SceneContentProps {
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
  showGuides?: boolean;
  isTransforming: boolean;
}

export function SceneContent({
  modules,
  selectedModuleId,
  transformMode,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  controlsRef,
  editorPreferences,
  readOnly,
  showGuides,
  isTransforming,
}: SceneContentProps) {
  return (
    <SceneElements
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
      showGuides={showGuides}
      isTransforming={isTransforming}
    />
  );
}
