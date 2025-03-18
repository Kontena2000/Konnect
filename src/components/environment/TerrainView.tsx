import { useRef, useEffect, useMemo } from "react";
import { TerrainData } from "@/services/environment";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Grid } from "@react-three/drei";
import { Html } from "@/components/environment/Html";
import { MeshTransmissionMaterial } from '@react-three/drei';

export interface TerrainViewProps {
  terrain: TerrainData;
  showGrid?: boolean;
  showMeasurements?: boolean;
  materialType?: "soil" | "concrete" | "grass";
  wireframe?: boolean;
}

export function TerrainView({ 
  terrain, 
  showGrid = true, 
  showMeasurements = false,
  materialType = "soil",
  wireframe = false 
}: TerrainViewProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      terrain.dimensions[0],
      terrain.dimensions[1],
      terrain.resolution,
      terrain.resolution
    );

    const vertices = geo.attributes.position.array;
    terrain.points.forEach((point, i) => {
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = point.z;
    });

    geo.computeVertexNormals();
    return geo;
  }, [terrain]);

  const material = useMemo(() => {
    const materialConfigs = {
      soil: {
        color: '#8B7355',
        roughnessUrl: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43',
        displacementUrl: 'https://images.unsplash.com/photo-1550537687-c91072c4792d',
        normalUrl: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43'
      },
      concrete: {
        color: '#808080',
        roughnessUrl: 'https://images.unsplash.com/photo-1585202900225-6d3ac20a6962',
        displacementUrl: 'https://images.unsplash.com/photo-1585202900225-6d3ac20a6962',
        normalUrl: 'https://images.unsplash.com/photo-1585202900225-6d3ac20a6962'
      },
      grass: {
        color: '#228B22',
        roughnessUrl: 'https://images.unsplash.com/photo-1496150507328-1f985853c2d1',
        displacementUrl: 'https://images.unsplash.com/photo-1496150507328-1f985853c2d1',
        normalUrl: 'https://images.unsplash.com/photo-1496150507328-1f985853c2d1'
      }
    };

    const config = materialConfigs[materialType];
    const textureLoader = new THREE.TextureLoader();
    const mat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.8,
      metalness: 0.1,
      wireframe,
      flatShading: false,
      side: THREE.DoubleSide
    });

    if (!wireframe) {
      textureLoader.load(config.roughnessUrl, (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(terrain.dimensions[0] / 5, terrain.dimensions[1] / 5);
        mat.roughnessMap = texture;
        mat.needsUpdate = true;
      });

      textureLoader.load(config.normalUrl, (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(terrain.dimensions[0] / 5, terrain.dimensions[1] / 5);
        mat.normalMap = texture;
        mat.normalScale.set(0.5, 0.5);
        mat.needsUpdate = true;
      });

      textureLoader.load(config.displacementUrl, (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(terrain.dimensions[0] / 5, terrain.dimensions[1] / 5);
        mat.displacementMap = texture;
        mat.displacementScale = 0.2;
        mat.needsUpdate = true;
      });
    }

    return mat;
  }, [materialType, wireframe, terrain.dimensions]);

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
            args={[terrain.dimensions[0], terrain.dimensions[1], 20, 20]}
            position={[0, 0.01, 0]}
            cellColor="#666666"
            sectionColor="#444444"
          />
          {showMeasurements && Array.from({ length: 5 }).map((_, i) => (
            <group key={i} position={[i * terrain.dimensions[0] / 4, 0.02, 0]}>
              <mesh>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="red" />
              </mesh>
              <Html position={[0, 0.2, 0]}>
                <div className="bg-background/80 px-2 py-1 rounded text-sm">
                  {(i * terrain.dimensions[0] / 4).toFixed(1)}m
                </div>
              </Html>
            </group>
          ))}
        </>
      )}
    </group>
  );
}