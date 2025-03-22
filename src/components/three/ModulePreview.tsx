import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { Billboard, Html } from '@react-three/drei';

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
    if (groupRef.current && previewMesh) {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.rotation.y = rotationY;
      
      // Update shadow
      if (shadowRef.current) {
        const boundingBox = new THREE.Box3().setFromObject(previewMesh);
        const size = new Vector3();
        boundingBox.getSize(size);
        
        shadowRef.current.position.set(position[0], 0.01, position[2]);
        
        // Create shadow rotation that maintains flat orientation while following Y rotation
        const shadowRotation = new Euler(-Math.PI/2, 0, rotationY);
        shadowRef.current.rotation.copy(shadowRotation);
      }
    }
  }, [position, rotationY, previewMesh]);

  if (!previewMesh) return null;

  const boundingBox = new THREE.Box3().setFromObject(previewMesh);
  const size = new Vector3();
  boundingBox.getSize(size);

  return (
    <>
      <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
        <primitive object={previewMesh} />
      </group>
      
      <mesh 
        ref={shadowRef}
        position={[position[0], 0.01, position[2]]}
        rotation={[-Math.PI/2, 0, rotationY]}
        receiveShadow
      >
        <planeGeometry args={[size.x, size.z]} />
        <meshBasicMaterial 
          color='#000000'
          transparent
          opacity={0.2}
          side={DoubleSide}
        />
      </mesh>
      
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