
import { DoubleSide, Euler, Vector3 } from "three";
import { Module } from "@/types/module";

interface ModuleShadowProps {
  module: Module;
  position: Vector3;
  rotation: Euler;
}

export function ModuleShadow({ module, position, rotation }: ModuleShadowProps) {
  return (
    <mesh
      position={[position.x, 0.01, position.z]}
      rotation={[Math.PI/2, 0, rotation.y]}
    >
      <planeGeometry args={[module.dimensions.length, module.dimensions.width]} />
      <meshBasicMaterial 
        color='#000000'
        transparent
        opacity={0.2}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
