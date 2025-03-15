
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { useEffect, useState } from "react";

interface SceneContainerProps {
  modules: any[];
  onModuleSelect?: (moduleId: string) => void;
}

export function SceneContainer({ modules, onModuleSelect }: SceneContainerProps) {
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
        
        {modules.map((module) => (
          <ModuleObject
            key={module.id}
            module={module}
            onClick={() => onModuleSelect?.(module.id)}
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
