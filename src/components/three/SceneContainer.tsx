import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, ContactShadows, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { ModuleObject } from "./ModuleObject";
import { ModuleControls } from "./ModuleControls";
import { useRef, useState } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { ConnectionLine } from './ConnectionLine';
import { Connection } from '@/services/layout';
import { EnvironmentalElement } from '@/components/environment/EnvironmentalElement';
import { TerrainView } from '@/components/environment/TerrainView';
import type { EnvironmentalElement as ElementType, TerrainData } from '@/services/environment';
import { useDroppable } from '@dnd-kit/core';
import { ConnectionType } from "@/components/three/ModuleLibrary";

interface SceneContainerProps {
  modules: any[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: any) => void;
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
  connectionMode?: 'cable' | 'pipe';
  onAddIntermediatePoint?: (point: [number, number, number]) => void;
}

const getConnectionColor = (type: ConnectionType): string => {
  // Power cables
  if (type.includes("3phase")) return "#ff0000";
  if (type.includes("ups")) return "#ff6b00";
  
  // Network cables - Copper
  if (type.startsWith("cat")) return "#00ff00";
  
  // Network cables - Fiber
  if (["om3", "om4", "om5", "os2", "mtp-mpo"].includes(type)) return "#00ffff";

  // Cooling tubes
  if (type === "chilled-water") return "#0088ff";
  if (type === "refrigerant") return "#00aaff";
  if (type === "air-duct") return "#88ccff";
  
  return "#999999";
};

export function SceneContainer({ 
  modules, 
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onDropPoint,
  connections = [],
  activeConnection,
  onConnectPoint,
  readOnly = false,
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  cameraZoom = 1,
  connectionMode = 'cable',
  onAddIntermediatePoint
}: SceneContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'scene-container'
  });
  
  const planeRef = useRef<THREE.Mesh>(null);
  const [hoverPoint, setHoverPoint] = useState<[number, number, number] | null>(null);

  const handlePlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (readOnly) return;
    if (planeRef.current) {
      const point = event.intersections[0]?.point.toArray() as [number, number, number];
      if (point) {
        point[0] = Math.round(point[0]);
        point[1] = 0;
        point[2] = Math.round(point[2]);
        setHoverPoint(point);
      }
    }
  };

  const handleModuleUpdate = (moduleId: string, updates: any) => {
    if (updates.position) {
      updates.position[0] = Math.round(updates.position[0]);
      updates.position[1] = Math.max(0, Math.round(updates.position[1]));
      updates.position[2] = Math.round(updates.position[2]);
    }
    onModuleUpdate?.(moduleId, updates);
  };

  const handlePlaneClick = (event: ThreeEvent<MouseEvent>) => {
    if (readOnly) return;
    if (hoverPoint) {
      if (activeConnection && onAddIntermediatePoint) {
        onAddIntermediatePoint(hoverPoint);
      } else if (onDropPoint) {
        onDropPoint(hoverPoint);
      }
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className="w-full h-full bg-background rounded-lg overflow-hidden"
    >
      <Canvas
        camera={{ 
          position: [10 * cameraZoom, 10 * cameraZoom, 10 * cameraZoom], 
          fov: 50 
        }}
        shadows
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
      >
        <color attach="background" args={["#f5f5f5"]} />
        <fog attach="fog" args={["#f5f5f5", 30, 100]} />
        
        <Environment preset="sunset" />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-10, 5, -5]}
          intensity={0.5}
          color="#ffd7b5"
        />
        
        <AccumulativeShadows
          temporal
          frames={60}
          alphaTest={0.85}
          scale={20}
          position={[0, -0.01, 0]}
          color="#404040"
        >
          <RandomizedLight
            amount={8}
            radius={10}
            intensity={1}
            ambient={0.5}
            position={[10, 10, -5]}
          />
        </AccumulativeShadows>

        {terrain ? (
          <TerrainView
            data={terrain}
            showGrid={true}
            showMeasurements={true}
            materialType="soil"
          />
        ) : (
          <Grid
            infiniteGrid
            cellSize={1}
            sectionSize={3}
            fadeDistance={50}
            fadeStrength={1}
          />
        )}
        
        <ContactShadows
          opacity={0.5}
          scale={20}
          blur={1}
          far={10}
          resolution={256}
          color="#000000"
        />

        <mesh
          ref={planeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={handlePlanePointerMove}
          onClick={handlePlaneClick}
          visible={false}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {modules.map((module) => (
          <group key={module.id}>
            <ModuleObject
              module={module}
              onClick={readOnly ? undefined : () => onModuleSelect?.(module.id)}
              selected={!readOnly && module.id === selectedModuleId}
              onConnectPoint={readOnly ? undefined : onConnectPoint}
            />
            {!readOnly && module.id === selectedModuleId && (
              <ModuleControls
                object={module}
                mode={transformMode}
                onTransformChange={(type, value) => {
                  if (type === "dragging-changed" && !value.dragging) {
                    handleModuleUpdate(module.id, value);
                  }
                }}
              />
            )}
          </group>
        ))}
        
        {connections.map((connection) => (
          <ConnectionLine
            key={connection.id}
            start={connection.sourcePoint}
            end={connection.targetPoint}
            intermediatePoints={connection.intermediatePoints}
            color={getConnectionColor(connection.type)}
            type={connectionMode}
            capacity={connection.capacity}
          />
        ))}

        {!readOnly && activeConnection && (
          <ConnectionLine
            start={activeConnection.sourcePoint}
            end={hoverPoint || activeConnection.sourcePoint}
            color="#999999"
            type={connectionMode}
          />
        )}

        {!readOnly && hoverPoint && (
          <mesh position={hoverPoint}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="red" transparent opacity={0.5} />
          </mesh>
        )}

        {environmentalElements.map((element) => (
          <EnvironmentalElement
            key={element.id}
            element={element}
            onClick={() => onEnvironmentalElementSelect?.(element.id)}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>
    </div>
  );
}