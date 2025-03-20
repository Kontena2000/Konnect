import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

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
    if (camera && ref.current) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      if (ref.current.reset) {
        ref.current.reset();
      }
    }
  }, [camera, ref]);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;

    const updateControls = () => {
      if (!enabled) {
        controls.enabled = false;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = false;
      } else {
        controls.enabled = true;
        controls.enableZoom = enableZoom;
        controls.enablePan = enablePan;
        controls.enableRotate = true;
      }
      controls.enableDamping = enabled;
      controls.update();
    };

    updateControls();

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
  }, [enabled, enableZoom, enablePan, ref]);

  return (
    <OrbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      enabled={enabled}
      enableZoom={enableZoom && enabled}
      enablePan={enablePan && enabled}
      enableRotate={enabled}
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