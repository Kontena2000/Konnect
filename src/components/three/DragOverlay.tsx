
import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return (
    <DragOverlay dropAnimation={null}>
      <div 
        style={{
          width: "200px",
          height: "200px",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)"
        }}
      >
        <Canvas
          camera={{ position: [2, 2, 2], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[
              template.dimensions.length,
              template.dimensions.height,
              template.dimensions.width
            ]} />
            <meshStandardMaterial 
              color={template.color} 
              transparent 
              opacity={0.7}
            />
          </mesh>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate />
          <gridHelper args={[10, 10]} />
        </Canvas>
      </div>
    </DragOverlay>
  );
}
