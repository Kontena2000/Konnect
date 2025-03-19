
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

interface CameraControlsProps {
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

export interface CameraControlsHandle {
  setAzimuthalAngle: (angle: number) => void;
  setPolarAngle: (angle: number) => void;
  saveState: () => void;
  reset: () => void;
}

export const CameraControls = forwardRef<CameraControlsHandle, CameraControlsProps>(({
  enableZoom = true,
  enablePan = true,
  minDistance = 5,
  maxDistance = 50,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI / 2.1
}, ref) => {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  useImperativeHandle(ref, () => ({
    setAzimuthalAngle: (angle: number) => {
      if (controlsRef.current) {
        controlsRef.current.setAzimuthalAngle(angle);
      }
    },
    setPolarAngle: (angle: number) => {
      if (controlsRef.current) {
        controlsRef.current.setPolarAngle(angle);
      }
    },
    saveState: () => {
      if (controlsRef.current) {
        controlsRef.current.saveState();
      }
    },
    reset: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    }
  }));

  useEffect(() => {
    if (camera && controlsRef.current) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      controlsRef.current.setAzimuthalAngle(Math.PI / 4);
      controlsRef.current.setPolarAngle(Math.PI / 4);
      controlsRef.current.saveState();
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
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
});

CameraControls.displayName = "CameraControls";
