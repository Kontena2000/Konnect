import React, { useRef, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Color, DoubleSide, Vector3 } from "three";
import * as THREE from "three";
import { Html, Billboard } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

interface ModulePreviewProps {
  position: [number, number, number];
  rotationY: number;
  previewMesh: Mesh | null;
  setRotationAngle: (angle: number | ((prev: number) => number)) => void;
}

export function ModulePreview({
  position,
  rotationY,
  previewMesh,
  setRotationAngle
}: ModulePreviewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  // Update the position and rotation of the preview group
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.rotation.y = rotationY;
      
      // Update shadow
      if (shadowRef.current && previewMesh) {
        const boundingBox = new THREE.Box3().setFromObject(previewMesh);
        const size = new Vector3();
        boundingBox.getSize(size);
        
        shadowRef.current.position.set(position[0], 0.01, position[2]);
        shadowRef.current.rotation.set(-Math.PI/2, 0, rotationY);
      }
    }
  }, [position, rotationY, previewMesh]);
  
  // If there's no preview mesh, don't render anything
  if (!previewMesh) return null;
  
  // Calculate dimensions for the shadow
  const boundingBox = new THREE.Box3().setFromObject(previewMesh);
  const size = new Vector3();
  boundingBox.getSize(size);
  
  // Create a material for the preview
  const previewMaterial = new THREE.MeshStandardMaterial({
    color: new Color('#44aaff'),
    transparent: true,
    opacity: 0.6,
    wireframe: false
  });

  useEffect(() => {
    previewMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.updateMatrixWorld(true);
      }
    });
  }, [previewMesh, rotationY]);

  return (
    <>
      {/* The preview mesh */}
      <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
        <primitive object={previewMesh} />
      </group>
      
      {/* Shadow below the preview */}
      <mesh 
        ref={shadowRef}
        position={[position[0], 0.01, position[2]]}
        rotation={[-Math.PI/2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[
          previewMesh.geometry.parameters.width,
          previewMesh.geometry.parameters.depth
        ]} />
        <meshBasicMaterial 
          color='#000000'
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>
      
      {/* Rotation controls */}
      <Billboard
        follow={true}
        position={[position[0], position[1] + size.y + 1, position[2]]}
      >
        <Html center>
          <div className='bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1'>
            <button 
              className='p-1 hover:bg-accent rounded'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setRotationAngle(prev => prev - Math.PI/2);
              }}
            >
              ⟲
            </button>
            <button 
              className='p-1 hover:bg-accent rounded'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setRotationAngle(prev => prev + Math.PI/2);
              }}
            >
              ⟳
            </button>
          </div>
        </Html>
      </Billboard>
    </>
  );
}