import React, { useMemo } from "react";
import { Vector2, Vector3, Line3, Color, Mesh } from "three";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { ModuleObject } from "./ModuleObject";
import { ModulePreview } from "./ModulePreview";
import * as THREE from "three";

interface SceneElementsProps {
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
  previewMesh: Mesh | null;
  rotationAngle: number;
  showGuides?: boolean;
  snapPoints: Vector3[];
  snapLines: Line3[];
  previewPosition: [number, number, number];
  readOnly?: boolean;
  setRotationAngle: (angle: number | ((prev: number) => number)) => void;
  isTransforming: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}

export function SceneElements({
  modules,
  selectedModuleId,
  transformMode,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  connections,
  environmentalElements = [],
  terrain,
  onEnvironmentalElementSelect,
  gridSnap = true,
  isDraggingOver = false,
  previewMesh,
  rotationAngle,
  showGuides = true,
  snapPoints,
  snapLines,
  previewPosition,
  readOnly = false,
  setRotationAngle,
  isTransforming,
  onTransformStart,
  onTransformEnd
}: SceneElementsProps) {
  
  // Memoize the selected module to prevent unnecessary re-renders
  const selectedModule = useMemo(() => {
    return modules.find(m => m.id === selectedModuleId);
  }, [modules, selectedModuleId]);

  // Render connections between modules
  const renderConnections = useMemo(() => {
    return connections.map((connection, index) => {
      const sourceModule = modules.find(m => m.id === connection.sourceModuleId);
      const targetModule = modules.find(m => m.id === connection.targetModuleId);
      
      if (!sourceModule || !targetModule) return null;
      
      // Find the connection points
      const sourcePoint = sourceModule.connectionPoints?.find(
        cp => cp.id === connection.sourcePointId
      );
      
      const targetPoint = targetModule.connectionPoints?.find(
        cp => cp.id === connection.targetPointId
      );
      
      if (!sourcePoint || !targetPoint) return null;
      
      // Calculate world positions
      const sourcePos = new Vector3(
        sourceModule.position[0] + sourcePoint.position[0],
        sourceModule.position[1] + sourcePoint.position[1],
        sourceModule.position[2] + sourcePoint.position[2]
      );
      
      const targetPos = new Vector3(
        targetModule.position[0] + targetPoint.position[0],
        targetModule.position[1] + targetPoint.position[1],
        targetModule.position[2] + targetPoint.position[2]
      );
      
      // Create a material with a color based on the connection type
      const material = new THREE.LineBasicMaterial({ 
        color: connection.color || '#ff8800',
        linewidth: 2,
        opacity: 0.8,
        transparent: true
      });
      
      // Create a geometry from the points
      const geometry = new THREE.BufferGeometry().setFromPoints([sourcePos, targetPos]);
      
      return (
        <primitive key={`connection-${index}`} object={new THREE.Line(geometry, material)} />
      );
    });
  }, [connections, modules]);

  // Render environmental elements
  const renderEnvironmentalElements = useMemo(() => {
    return environmentalElements.map((element) => {
      return (
        <group
          key={element.id}
          position={element.position}
          rotation={element.rotation}
          scale={element.scale}
          onClick={() => onEnvironmentalElementSelect?.(element.id)}
        >
          {element.type === 'box' && (
            <mesh castShadow receiveShadow>
              <boxGeometry args={[element.size?.width || 1, element.size?.height || 1, element.size?.depth || 1]} />
              <meshStandardMaterial color={element.color || '#aaaaaa'} />
            </mesh>
          )}
          {element.type === 'sphere' && (
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[(element.size?.width || 1) / 2, 32, 32]} />
              <meshStandardMaterial color={element.color || '#aaaaaa'} />
            </mesh>
          )}
          {element.type === 'cylinder' && (
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[(element.size?.width || 1) / 2, (element.size?.width || 1) / 2, element.size?.height || 1, 32]} />
              <meshStandardMaterial color={element.color || '#aaaaaa'} />
            </mesh>
          )}
        </group>
      );
    });
  }, [environmentalElements, onEnvironmentalElementSelect]);

  // Render alignment guides
  const renderGuides = useMemo(() => {
    if (!showGuides || (!isDraggingOver && !isTransforming)) return null;

    return (
      <group>
        {/* Snap points */}
        {snapPoints.map((point, index) => (
          <mesh key={`point-${index}`} position={point}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.7} />
          </mesh>
        ))}
        
        {/* Snap lines */}
        {snapLines.map((line, index) => {
          // Extend the line for better visibility
          const direction = line.end.clone().sub(line.start).normalize();
          const startExtended = line.start.clone().sub(direction.clone().multiplyScalar(100));
          const endExtended = line.end.clone().add(direction.clone().multiplyScalar(100));
          
          const geometry = new THREE.BufferGeometry().setFromPoints([startExtended, endExtended]);
          const material = new THREE.LineBasicMaterial({ color: '#00ffff', transparent: true, opacity: 0.6 });
          
          return (
            <primitive key={`line-${index}`} object={new THREE.Line(geometry, material)} />
          );
        })}
      </group>
    );
  }, [showGuides, isDraggingOver, isTransforming, snapPoints, snapLines]);

  // Render terrain if available
  const renderTerrain = useMemo(() => {
    if (!terrain) return null;
    
    return (
      <mesh
        position={[0, terrain.position?.[1] || 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[terrain.size?.width || 100, terrain.size?.depth || 100, 1, 1]} />
        <meshStandardMaterial
          color={terrain.color || "#7a7d7c"}
          roughness={terrain.roughness || 0.8}
          metalness={terrain.metalness || 0.2}
        />
      </mesh>
    );
  }, [terrain]);

  return (
    <group>
      {/* Render terrain */}
      {renderTerrain}

      {/* Render all modules */}
      {modules.map(module => (
        <ModuleObject
          key={module.id}
          module={module}
          modules={modules}
          selected={module.id === selectedModuleId}
          onClick={() => onModuleSelect?.(module.id)}
          onUpdate={(updates) => onModuleUpdate?.(module.id, updates)}
          onDelete={onModuleDelete ? () => onModuleDelete(module.id) : undefined}
          transformMode={transformMode}
          gridSnap={gridSnap}
          readOnly={readOnly}
          onTransformStart={onTransformStart}
          onTransformEnd={onTransformEnd}
        />
      ))}

      {/* Render connections */}
      {renderConnections}

      {/* Render environmental elements */}
      {renderEnvironmentalElements}

      {/* Render alignment guides */}
      {renderGuides}

      {/* Render module preview when dragging */}
      {isDraggingOver && previewMesh && (
        <ModulePreview
          position={previewPosition}
          rotationY={rotationAngle}
          previewMesh={previewMesh}
          setRotationAngle={setRotationAngle}
        />
      )}
    </group>
  );
}