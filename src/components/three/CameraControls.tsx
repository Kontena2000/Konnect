
import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

interface CameraControlsProps {
  controlsRef?: React.RefObject<any>;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

export function CameraControls({
  controlsRef,
  enableZoom = true,
  enablePan = true,
  minDistance = 5,
  maxDistance = 50,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI / 2.1
}: CameraControlsProps) {
  const localRef = useRef(null);
  const ref = controlsRef || localRef;
  const { camera, gl } = useThree();
  
  // Set initial camera position
  useEffect(() => {
    if (camera) {
      // Set to isometric-like view
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      enableZoom={enableZoom}
      enablePan={enablePan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      // Prevent camera from going below ground
      maxAzimuthAngle={Infinity}
      minAzimuthAngle={-Infinity}
      // Make camera movement smoother
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}
