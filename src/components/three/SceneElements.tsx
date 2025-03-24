
import { useThree } from "@react-three/fiber";
import { ModuleObject } from "./ModuleObject";
import { ConnectionLine } from "./ConnectionLine";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { useRef, useEffect } from "react";
import { GridHelper } from "./GridHelper";
import { CameraControls } from "./CameraControls";
import { EditorPreferences } from "@/services/editor-preferences";

interface SceneElementsProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections: Connection[];
  readOnly?: boolean;
  showGuides?: boolean;
  isTransforming: boolean;
  editorPreferences?: EditorPreferences | null;
}

export function SceneElements({
  modules,
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  readOnly = false,
  showGuides = false,
  isTransforming,
  editorPreferences
}: SceneElementsProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    return () => {
      if (controls) {
        controls.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (camera) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <CameraControls 
        controlsRef={controlsRef}
        enabled={!isTransforming}
        enableZoom={!isTransforming}
        enablePan={!isTransforming}
        enableRotate={!isTransforming}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
      />
      
      {showGuides && <GridHelper preferences={editorPreferences?.grid} />}

      {modules.map(module => (
        <ModuleObject
          key={module.id}
          module={module}
          modules={modules}
          selected={module.id === selectedModuleId}
          onClick={() => onModuleSelect?.(module.id)}
          onUpdate={updates => onModuleUpdate?.(module.id, updates)}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          readOnly={readOnly}
          editorPreferences={editorPreferences}
        />
      ))}

      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
        />
      ))}
    </>
  );
}
