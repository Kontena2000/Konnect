
import { TransformControls } from "@react-three/drei";
import { Mesh, Object3D } from "three";
import { useCallback } from "react";

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
  // Create a handler for the dragging-changed event
  const handleDraggingChanged = useCallback((e: any) => {
    // This ensures we capture the end of transform operations
    if (e.type === 'dragging-changed') {
      if (e.value === true) {
        // Dragging started
        onTransformStart?.();
      } else if (e.value === false) {
        // Dragging ended
        console.log('Transform dragging ended, calling onTransformEnd');
        
        // Make sure to update one last time before ending transform
        onUpdate();
        
        // Call the transform end handler
        onTransformEnd?.();
      }
    }
  }, [onTransformStart, onTransformEnd, onUpdate]);

  if (!meshRef.current) return null;

  return (
    <TransformControls
      object={meshRef.current as Object3D}
      mode={transformMode}
      onChange={() => {
        // Called during continuous transform
        onUpdate();
      }}
      onObjectChange={() => {
        // Called when the object being transformed changes
        onUpdate();
      }}
      onUpdate={handleDraggingChanged}
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
