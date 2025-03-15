
import { useRef, useEffect, useMemo } from "react";
import { TerrainData } from "@/services/environment";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Grid } from "@react-three/drei";
import { Html } from "@/components/environment/Html";

interface TerrainViewProps {
  data: TerrainData;
  showGrid?: boolean;
  showMeasurements?: boolean;
  materialType?: "soil" | "concrete" | "grass";
  wireframe?: boolean;
}

export function TerrainView({ 
  data, 
  showGrid = true, 
  showMeasurements = false,
  materialType = "soil",
  wireframe = false 
}: TerrainViewProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      data.dimensions[0],
      data.dimensions[1],
      data.resolution,
      data.resolution
    );

    const vertices = geo.attributes.position.array;
    data.points.forEach((point, i) => {
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = point.z;
    });

    geo.computeVertexNormals();
    return geo;
  }, [data]);

  const material = useMemo(() => {
    const materialColors = {
      soil: "#8B7355",
      concrete: "#808080",
      grass: "#228B22"
    };

    const mat = new THREE.MeshStandardMaterial({
      color: materialColors[materialType],
      roughness: 1,
      metalness: 0,
      wireframe,
      flatShading: true
    });

    if (!wireframe) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        `https://images.unsplash.com/${materialType === "grass" ? "photo-1496150507328-1f985853c2d1" : 
                                    materialType === "concrete" ? "photo-1585202900225-6d3ac20a6962" : 
                                    "photo-1526394931762-90052aa1dda9"}`,
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(data.dimensions[0] / 5, data.dimensions[1] / 5);
          mat.map = texture;
          mat.needsUpdate = true;
        }
      );
    }

    return mat;
  }, [materialType, wireframe, data.dimensions]);

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />
      
      {showGrid && (
        <>
          <Grid
            args={[data.dimensions[0], data.dimensions[1], 20, 20]}
            position={[0, 0.01, 0]}
            cellColor="#666666"
            sectionColor="#444444"
          />
          {showMeasurements && Array.from({ length: 5 }).map((_, i) => (
            <group key={i} position={[i * data.dimensions[0] / 4, 0.02, 0]}>
              <mesh>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="red" />
              </mesh>
              <Html position={[0, 0.2, 0]}>
                <div className="bg-background/80 px-2 py-1 rounded text-sm">
                  {(i * data.dimensions[0] / 4).toFixed(1)}m
                </div>
              </Html>
            </group>
          ))}
        </>
      )}
    </group>
  );
}
