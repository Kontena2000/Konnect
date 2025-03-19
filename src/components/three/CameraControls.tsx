
import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface CameraControlsProps {
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  locked?: boolean;
}

export interface CameraControlsHandle {
  setAzimuthalAngle: (angle: number) => void;
  setPolarAngle: (angle: number) => void;
  saveState: () => void;
  reset: () => void;
}

interface SavedCameraState {
  position: Vector3;
  target: Vector3;
  zoom: number;
}

export const CameraControls = forwardRef<CameraControlsHandle, CameraControlsProps>(({
  enableZoom = true,
  enablePan = true,
  minDistance = 5,
  maxDistance = 50,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI / 2.1,
  locked = false
}, ref) => {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const [savedState, setSavedState] = useState<SavedCameraState | null>(null);

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
        const state = {
          position: camera.position.clone(),
          target: controlsRef.current.target.clone(),
          zoom: camera.zoom
        };
        setSavedState(state);
      }
    },
    reset: () => {
      if (controlsRef.current && savedState) {
        camera.position.copy(savedState.position);
        controlsRef.current.target.copy(savedState.target);
        camera.zoom = savedState.zoom;
        camera.updateProjectionMatrix();
        controlsRef.current.update();
      }
    }
  }));

  // Initialize camera position
  useEffect(() => {
    if (camera && controlsRef.current) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      controlsRef.current.setAzimuthalAngle(Math.PI / 4);
      controlsRef.current.setPolarAngle(Math.PI / 4);
      
      // Save initial state
      const initialState = {
        position: camera.position.clone(),
        target: controlsRef.current.target.clone(),
        zoom: camera.zoom
      };
      setSavedState(initialState);
    }
  }, [camera]);

  // Handle locking state changes
  useEffect(() => {
    if (controlsRef.current) {
      if (locked) {
        // Save current state before locking
        const state = {
          position: camera.position.clone(),
          target: controlsRef.current.target.clone(),
          zoom: camera.zoom
        };
        setSavedState(state);
      } else if (savedState) {
        // Restore state when unlocking
        camera.position.copy(savedState.position);
        controlsRef.current.target.copy(savedState.target);
        camera.zoom = savedState.zoom;
        camera.updateProjectionMatrix();
        controlsRef.current.update();
      }
    }
  }, [locked, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableZoom={!locked && enableZoom}
      enablePan={!locked && enablePan}
      enableRotate={!locked}
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
