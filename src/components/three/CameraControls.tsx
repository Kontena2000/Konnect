import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from 'three';

interface CameraControlsProps {
  controlsRef?: React.RefObject<any>;
  enabled?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
}

export function CameraControls({
  controlsRef,
  enabled = true,
  enableZoom = true,
  enablePan = true,
  enableRotate = true,
  minDistance = 5,
  maxDistance = 50,
  minPolarAngle = 0,
  maxPolarAngle = Math.PI / 2.1
}: CameraControlsProps) {
  const localRef = useRef<any>(null);
  const ref = controlsRef || localRef;
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!ref.current) return;

    const controls = ref.current;
    
    // Immediately update controls state
    controls.enabled = enabled;
    controls.enableZoom = enabled && enableZoom;
    controls.enablePan = enabled && enablePan;
    controls.enableRotate = enabled && enableRotate;
    controls.enableDamping = enabled;
    
    // Force controls update
    controls.update();

    // Add methods for camera position control
    controls.reset = () => {
      // Set camera to top-down 2D view
      camera.position.set(0, 20, 0);
      camera.lookAt(0, 0, 0);
      controls.update();
    };

    controls.setAzimuthalAngle = (angle: number) => {
      try {
        // Get current distance from target
        const distance = camera.position.distanceTo(controls.target);
        
        // Calculate new position
        const x = controls.target.x + distance * Math.sin(angle);
        const y = camera.position.y; // Keep the same height
        const z = controls.target.z + distance * Math.cos(angle);
        
        // Set new position
        camera.position.set(x, y, z);
        camera.lookAt(controls.target);
        controls.update();
        
        console.log('Set azimuthal angle to:', angle, 'New camera position:', camera.position);
      } catch (error) {
        console.error('Error in setAzimuthalAngle:', error);
      }
    };

    controls.setPolarAngle = (angle: number) => {
      try {
        // Get current horizontal distance and azimuth
        const horizontalDistance = Math.sqrt(
          Math.pow(camera.position.x - controls.target.x, 2) +
          Math.pow(camera.position.z - controls.target.z, 2)
        );
        
        const currentAzimuth = Math.atan2(
          camera.position.x - controls.target.x,
          camera.position.z - controls.target.z
        );
        
        // Calculate new height based on polar angle
        const newHorizontalDistance = Math.sin(angle) * camera.position.distanceTo(controls.target);
        const newHeight = controls.target.y + Math.cos(angle) * camera.position.distanceTo(controls.target);
        
        // Calculate new position
        const x = controls.target.x + newHorizontalDistance * Math.sin(currentAzimuth);
        const y = newHeight;
        const z = controls.target.z + newHorizontalDistance * Math.cos(currentAzimuth);
        
        // Set new position
        camera.position.set(x, y, z);
        camera.lookAt(controls.target);
        controls.update();
        
        console.log('Set polar angle to:', angle, 'New camera position:', camera.position);
      } catch (error) {
        console.error('Error in setPolarAngle:', error);
      }
    };

    return () => {
      if (controls) {
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.enableDamping = true;
        controls.update();
      }
    };
  }, [enabled, enableZoom, enablePan, enableRotate, ref, camera]);

  return (
    <OrbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      enabled={enabled}
      enableZoom={enabled && enableZoom}
      enablePan={enabled && enablePan}
      enableRotate={enabled && enableRotate}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      maxAzimuthAngle={Infinity}
      minAzimuthAngle={-Infinity}
      enableDamping={enabled}
      dampingFactor={0.05}
    />
  );
}