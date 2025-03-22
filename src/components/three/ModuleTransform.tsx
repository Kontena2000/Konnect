
import { TransformControls } from "@react-three/drei";
import { Mesh } from "three";
import { useModuleTransform } from "@/hooks/use-module-transform";

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
  return (
    <TransformControls
      object={meshRef.current}
      mode={transformMode}
      onMouseDown={onTransformStart}
      onMouseUp={onTransformEnd}
      onChange={onUpdate}
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
