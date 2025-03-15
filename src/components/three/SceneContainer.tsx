import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { ModuleControls } from "./ModuleControls";
import { useRef, useState } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { ConnectionLine } from './ConnectionLine';
import { Connection } from '@/services/layout';
import { EnvironmentalElement } from '@/components/environment/EnvironmentalElement';
import { TerrainView } from '@/components/environment/TerrainView';
import type { EnvironmentalElement as ElementType } from '@/services/environment';

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
    type: string;
  } | null;
  onConnectPoint?: (moduleId: string, point: [number, number, number], type: string) => void;
  readOnly?: boolean;
  environmentalElements?: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
}

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
  onEnvironmentalElementSelect
}: SceneContainerProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const [hoverPoint, setHoverPoint] = useState<[number, number, number] | null>(null);

  const handlePlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (readOnly) return;
    if (planeRef.current) {
      const point = event.intersections[0]?.point.toArray() as [number, number, number];
      if (point) {
        point[1] = 0; // Lock Y position to ground
        setHoverPoint(point);
      }
    }
  };

  const handlePlaneClick = (event: ThreeEvent<MouseEvent>) => {
    if (readOnly) return;
    if (hoverPoint && onDropPoint) {
      onDropPoint(hoverPoint);
    }
  };

  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        
        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={3}
          fadeDistance={50}
          fadeStrength={1}
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
                    onModuleUpdate?.(module.id, value);
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
            color={
              connection.type === 'power'
                ? '#ff0000'
                : connection.type === 'network'
                ? '#00ff00'
                : '#0000ff'
            }
          />
        ))}

        {!readOnly && activeConnection && (
          <ConnectionLine
            start={activeConnection.sourcePoint}
            end={hoverPoint || activeConnection.sourcePoint}
            color='#999999'
          />
        )}

        {!readOnly && hoverPoint && (
          <mesh position={hoverPoint}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="red" transparent opacity={0.5} />
          </mesh>
        )}
        
        {terrain && (
          <TerrainView
            data={terrain}
            showGrid={true}
            showMeasurements={true}
            materialType='soil'
          />
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
        />
      </Canvas>
    </div>
  );
}