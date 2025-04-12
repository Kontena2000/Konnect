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
      // Calculate the current position in spherical coordinates
      const spherical = new THREE.Spherical().setFromVector3(
        new THREE.Vector3().subVectors(camera.position, controls.target)
      );
      
      // Set the new theta (azimuthal angle)
      spherical.theta = angle;
      
      // Convert back to cartesian coordinates
      const newPosition = new THREE.Vector3().setFromSpherical(spherical);
      
      // Apply the new position relative to the target
      camera.position.copy(newPosition.add(controls.target));
      
      // Update the camera
      camera.lookAt(controls.target);
      controls.update();
    };

    controls.setPolarAngle = (angle: number) => {
      // Calculate the current position in spherical coordinates
      const spherical = new THREE.Spherical().setFromVector3(
        new THREE.Vector3().subVectors(camera.position, controls.target)
      );
      
      // Set the new phi (polar angle)
      spherical.phi = angle;
      
      // Convert back to cartesian coordinates
      const newPosition = new THREE.Vector3().setFromSpherical(spherical);
      
      // Apply the new position relative to the target
      camera.position.copy(newPosition.add(controls.target));
      
      // Update the camera
      camera.lookAt(controls.target);
      controls.update();
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