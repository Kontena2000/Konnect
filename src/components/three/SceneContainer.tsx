
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { ModuleControls } from "./ModuleControls";
import { useRef, useState } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";

interface SceneContainerProps {
  modules: any[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: any) => void;
  onDropPoint?: (point: [number, number, number]) => void;
}

export function SceneContainer({ 
  modules, 
  selectedModuleId,
  transformMode = "translate",
  onModuleSelect,
  onModuleUpdate,
  onDropPoint 
}: SceneContainerProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const [hoverPoint, setHoverPoint] = useState<[number, number, number] | null>(null);

  const handlePlanePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (planeRef.current) {
      const point = event.intersections[0]?.point.toArray() as [number, number, number];
      if (point) {
        point[1] = 0; // Lock Y position to ground
        setHoverPoint(point);
      }
    }
  };

  const handlePlaneClick = (event: ThreeEvent<MouseEvent>) => {
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
              onClick={() => onModuleSelect?.(module.id)}
              selected={module.id === selectedModuleId}
            />
            {module.id === selectedModuleId && (
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
        
        {hoverPoint && (
          <mesh position={hoverPoint}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="red" transparent opacity={0.5} />
          </mesh>
        )}
        
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
