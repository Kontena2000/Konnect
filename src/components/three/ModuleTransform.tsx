import { TransformControls } from "@react-three/drei";
import { Mesh, Object3D } from "three";
import { useEffect } from "react";

interface ModuleTransformProps {
  meshRef: React.RefObject<Mesh>;
  transformMode: "translate" | "rotate" | "scale";
  gridSnap: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  onUpdate: () => void;
}

export function ModuleTransform({
  meshRef,
  transformMode,
  gridSnap,
  onTransformStart,
  onTransformEnd,
  onUpdate
}: ModuleTransformProps) {
  if (!meshRef.current) return null;

  return (
    <TransformControls
      object={meshRef.current as Object3D}
      mode={transformMode}
      onMouseDown={onTransformStart}
      onMouseUp={onTransformEnd}
      onChange={onUpdate}
      onObjectChange={onUpdate} // Ensure position updates are captured during transformation
      onDraggingChange={(event) => {
        // This ensures we capture the end of transform operations
        if (!event.value && onTransformEnd) {
          onTransformEnd();
        }
      }}
      size={0.75}
      showX={true}
      showY={true}
      showZ={true}
      enabled={true}
      translationSnap={gridSnap ? 1 : null}
      rotationSnap={gridSnap ? Math.PI / 4 : null}
      scaleSnap={gridSnap ? 0.25 : null}
      space="world"
    />
  );
}