
import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

interface CameraControlsProps {
  controlsRef?: React.RefObject<any>;
  enabled?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
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
    controls.enableRotate = enabled;
    controls.enableDamping = enabled;
    
    // Force controls update
    controls.update();

    // Add methods for camera position control
    controls.reset = () => {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      controls.update();
    };

    controls.setAzimuthalAngle = (angle: number) => {
      controls.setAzimuthalAngle(angle);
      controls.update();
    };

    controls.setPolarAngle = (angle: number) => {
      controls.setPolarAngle(angle);
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
  }, [enabled, enableZoom, enablePan, ref, camera]);

  return (
    <OrbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      enabled={enabled}
      enableZoom={enabled && enableZoom}
      enablePan={enabled && enablePan}
      enableRotate={enabled}
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
