
import { useRef, useEffect } from "react";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Object3D } from "three";

interface ModuleControlsProps {
  object: Object3D;
  mode?: "translate" | "rotate" | "scale";
  onTransformChange?: (type: string, value: any) => void;
}

export function ModuleControls({ object, mode = "translate", onTransformChange }: ModuleControlsProps) {
  const { camera, gl } = useThree();
  const transformRef = useRef<any>();

  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      const callback = (event: any) => {
        onTransformChange?.(event.type, {
          position: object.position.toArray(),
          rotation: object.rotation.toArray(),
          scale: object.scale.toArray(),
          dragging: event.value
        });
      };

      controls.addEventListener("dragging-changed", callback);
      return () => controls.removeEventListener("dragging-changed", callback);
    }
  }, [object, onTransformChange]);

  return (
    <TransformControls
      ref={transformRef}
      camera={camera}
      mode={mode}
      object={object}
      size={1}
    />
  );
}
