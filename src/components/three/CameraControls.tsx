import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

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
      console.log('Setting 2D view');
      // Set camera to top-down 2D view
      camera.position.set(0, 20, 0.001); // Small z offset to prevent issues
      camera.lookAt(0, 0, 0);
      controls.update();
    };

    controls.set3DView = () => {
      console.log('Setting 3D view');
      // Set camera to isometric view position
      camera.position.set(15, 15, 15);
      camera.lookAt(0, 0, 0);
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