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
  const localRef = useRef<any>(null);
  const ref = controlsRef || localRef;
  const { camera, gl } = useThree();
  
  useEffect(() => {
    if (camera && ref.current) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      ref.current.reset();
    }
  }, [camera, ref]);

  useEffect(() => {
    if (ref.current) {
      ref.current.enabled = enableZoom && enablePan;
    }
  }, [enableZoom, enablePan, ref]);

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
      maxAzimuthAngle={Infinity}
      minAzimuthAngle={-Infinity}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}