
import { useMemo } from "react";
import { Vector3 } from "three";

export function useGridSnapping(
  position: Vector3,
  gridSize: number = 1,
  snapThreshold: number = 0.5
): Vector3 {
  return useMemo(() => {
    const snappedPosition = position.clone();
    if (Math.abs(position.x % gridSize) < snapThreshold) {
      snappedPosition.x = Math.round(position.x / gridSize) * gridSize;
    }
    if (Math.abs(position.z % gridSize) < snapThreshold) {
      snappedPosition.z = Math.round(position.z / gridSize) * gridSize;
    }
    return snappedPosition;
  }, [position, gridSize, snapThreshold]);
}
