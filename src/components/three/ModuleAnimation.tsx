
import { useEffect } from "react";
import { Vector3, Mesh } from "three";
import gsap from "gsap";

interface ModuleAnimationProps {
  meshRef: React.RefObject<Mesh>;
  initialPosition: Vector3;
  finalHeight: number;
  onComplete: () => void;
  onUpdate: () => void;
}

export function ModuleAnimation({
  meshRef,
  initialPosition,
  finalHeight,
  onComplete,
  onUpdate
}: ModuleAnimationProps) {
  useEffect(() => {
    if (!meshRef.current) return;

    onComplete();
    return;
  }, [meshRef, initialPosition, finalHeight, onUpdate, onComplete]);

  return null;
}
