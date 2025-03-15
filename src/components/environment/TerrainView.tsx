
import { useRef, useEffect } from "react";
import { TerrainData } from "@/services/environment";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TerrainViewProps {
  data: TerrainData;
  showGrid?: boolean;
}

export function TerrainView({ data, showGrid = true }: TerrainViewProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  useEffect(() => {
    if (!meshRef.current) return;

    // Create geometry from terrain points
    const geometry = new THREE.PlaneGeometry(
      data.dimensions[0],
      data.dimensions[1],
      data.resolution,
      data.resolution
    );

    // Update vertices based on terrain data
    const vertices = geometry.attributes.position.array;
    data.points.forEach((point, i) => {
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = point.z;
    });

    geometry.computeVertexNormals();
    meshRef.current.geometry = geometry;
  }, [data]);

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#8B7355"
          roughness={1}
          metalness={0}
          wireframe={false}
        />
      </mesh>
      
      {showGrid && (
        <gridHelper
          ref={gridRef}
          args={[data.dimensions[0], data.dimensions[1], "#666666", "#444444"]}
        />
      )}
    </group>
  );
}
