
import { useRef } from "react";
import { Mesh } from "three";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EnvironmentalElement as ElementType } from "@/services/environment";

interface EnvironmentalElementProps {
  element: ElementType;
  onClick?: () => void;
  selected?: boolean;
}

export function EnvironmentalElement({ element, onClick, selected }: EnvironmentalElementProps) {
  const meshRef = useRef<Mesh>(null);

  const modelUrl = `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/${element.model}/glTF/${element.model}.gltf`;
  const gltf = useLoader(GLTFLoader, modelUrl);

  return (
    <group
      position={element.position}
      rotation={element.rotation}
      scale={element.scale}
      onClick={onClick}
    >
      <primitive object={gltf.scene} />
      {selected && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}
    </group>
  );
}
