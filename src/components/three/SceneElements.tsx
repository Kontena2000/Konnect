
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { ModuleObject } from "./ModuleObject";
import { ConnectionLine } from "./ConnectionLine";
import { Connection } from "@/services/layout";
import { Module } from "@/types/module";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { EnvironmentalElement } from "@/components/environment/EnvironmentalElement";
import { TerrainView } from "@/components/environment/TerrainView";
import * as THREE from 'three';
import { Vector2, Vector3, Line3 } from 'three';

interface SceneElementsProps {
  modules: Module[];
  selectedModuleId?: string;
  transformMode?: "translate" | "rotate" | "scale";
  onModuleSelect?: (moduleId: string) => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<Module>) => void;
  onModuleDelete?: (moduleId: string) => void;
  connections: Connection[];
  environmentalElements: ElementType[];
  terrain?: TerrainData;
  onEnvironmentalElementSelect?: (elementId: string) => void;
  gridSnap: boolean;
  isDraggingOver: boolean;
  previewMesh: THREE.Mesh | null;
  rotationAngle: number;
  showGuides: boolean;
  snapPoints: Vector3[];
  snapLines: Line3[];
  previewHeight: number;
  mousePosition: Vector2 | null;
  onDropPoint: (point: [number, number, number]) => void;
  cameraAngle?: "top" | "isometric" | "front" | "side";
}

export function SceneElements({
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
  previewMesh,
  rotationAngle,
  showGuides,
  snapPoints,
  snapLines,
  previewHeight,
  mousePosition,
  onDropPoint,
  cameraAngle = "isometric"
}: SceneElementsProps) {
  const { camera, scene } = useThree();

  useEffect(() => {
    // Update camera position based on selected angle
    switch (cameraAngle) {
      case "top":
        camera.position.set(0, 20, 0);
        camera.lookAt(0, 0, 0);
        break;
      case "isometric":
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        break;
      case "front":
        camera.position.set(0, 5, 20);
        camera.lookAt(0, 5, 0);
        break;
      case "side":
        camera.position.set(20, 5, 0);
        camera.lookAt(0, 5, 0);
        break;
    }
  }, [camera, cameraAngle]);

  useEffect(() => {
    if (isDraggingOver && mousePosition && previewMesh) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (mousePosition.x / window.innerWidth) * 2 - 1,
        -(mousePosition.y / window.innerHeight) * 2 + 1
      );
      
      raycaster.setFromCamera(mouse, camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersection);

      if (gridSnap) {
        // Find nearest snap point if close enough
        const snapThreshold = 1.5;
        const nearestPoint = snapPoints.reduce((nearest, point) => {
          const distance = intersection.distanceTo(point);
          return distance < snapThreshold && distance < nearest.distance
            ? { point, distance }
            : nearest;
        }, { point: intersection, distance: Infinity });

        intersection.copy(nearestPoint.point);
      } else {
        intersection.x = Math.round(intersection.x * 2) / 2;
        intersection.z = Math.round(intersection.z * 2) / 2;
      }

      previewMesh.position.set(
        intersection.x,
        previewHeight / 2,
        intersection.z
      );
      previewMesh.rotation.set(0, rotationAngle, 0);
    }
  }, [isDraggingOver, mousePosition, previewMesh, camera, gridSnap, snapPoints, previewHeight, rotationAngle]);

  return (
    <>
      <OrbitControls 
        makeDefault 
        enabled={!isDraggingOver}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={50}
      />
      
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5}
        cellSize={gridSnap ? 1 : 0.5}
        cellThickness={gridSnap ? 1 : 0.5}
        cellColor={isDraggingOver ? '#2563eb' : '#94a3b8'}
        sectionSize={gridSnap ? 10 : 5}
        sectionColor={isDraggingOver ? '#1d4ed8' : '#64748b'}
        sectionThickness={1.5}
        followCamera
      />

      <Environment preset='city' />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
      />

      {modules.map((module) => (
        <ModuleObject
          key={module.id}
          module={module}
          selected={module.id === selectedModuleId}
          onSelect={() => onModuleSelect?.(module.id)}
          onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
          onDelete={() => onModuleDelete?.(module.id)}
          transformMode={transformMode}
          gridSnap={gridSnap}
          castShadow
          receiveShadow
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

      {previewMesh && isDraggingOver && (
        <primitive 
          object={previewMesh} 
          position={[0, previewHeight / 2, 0]}
          rotation={[0, rotationAngle, 0]}
          castShadow
          receiveShadow
        />
      )}

      {showGuides && isDraggingOver && (
        <group>
          <gridHelper 
            args={[100, 100, '#2563eb', '#2563eb']}
            position={[0, 0.01, 0]}
          />
          <axesHelper args={[5]} />
          
          {snapPoints.map((point, index) => (
            <mesh key={`snap-point-${index}`} position={point}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#2563eb" transparent opacity={0.5} />
            </mesh>
          ))}

          {snapLines.map((line, index) => (
            <line key={`snap-line-${index}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    line.start.x, line.start.y, line.start.z,
                    line.end.x, line.end.y, line.end.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#2563eb" linewidth={1} />
            </line>
          ))}
        </group>
      )}
    </>
  );
}
