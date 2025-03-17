
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { useDroppable } from "@dnd-kit/core";
import { ConnectionLine } from "./ConnectionLine";
import { Connection, Module } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";

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
}

export function SceneContainer({
  modules,
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections = [],
  activeConnection,
  onConnectPoint,
  readOnly = false,
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  cameraZoom = 1,
  gridSnap = true
}: SceneContainerProps) {
  const { setNodeRef } = useDroppable({
    id: "scene"
  });

  return (
    <div ref={setNodeRef} className="w-full h-full">
      <Canvas camera={{ position: [10, 10, 10], zoom: cameraZoom }}>
        <OrbitControls makeDefault />
        <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {modules.map((module) => (
          <ModuleObject
            key={module.id}
            module={module}
            selected={module.id === selectedModuleId}
            onSelect={() => onModuleSelect?.(module.id)}
            onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
            onDelete={() => onModuleDelete?.(module.id)}
            transformMode={transformMode}
            readOnly={readOnly}
            gridSnap={gridSnap}
          />
        ))}

        {connections.map((connection) => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            selected={false}
          />
        ))}

        {environmentalElements.map((element) => (
          <EnvironmentalElement
            key={element.id}
            element={element}
            onSelect={() => onEnvironmentalElementSelect?.(element.id)}
          />
        ))}

        {terrain && <TerrainView data={terrain} />}
      </Canvas>
    </div>
  );
}
