
import { useMemo } from "react";
import { Vector3 } from "three";

export function useGridSnapping(
  position: Vector3,
  gridSize: number = 1,
  snapThreshold: number = 0.5
): Vector3 {
  return useMemo(() => {
    const snappedPosition = position.clone();
    
    // Only snap X and Z coordinates (ground plane)
    snappedPosition.x = Math.round(position.x / gridSize) * gridSize;
    snappedPosition.z = Math.round(position.z / gridSize) * gridSize;
    
    // Keep Y position unchanged
    snappedPosition.y = position.y;
    
    return snappedPosition;
  }, [position, gridSize, snapThreshold]);
}

export function getSnapPoints(position: Vector3, gridSize: number = 1): Vector3[] {
  const points: Vector3[] = [];
  const x = Math.round(position.x / gridSize) * gridSize;
  const z = Math.round(position.z / gridSize) * gridSize;

  // Add center point
  points.push(new Vector3(x, 0, z));

  // Add adjacent grid points
  points.push(new Vector3(x + gridSize, 0, z));
  points.push(new Vector3(x - gridSize, 0, z));
  points.push(new Vector3(x, 0, z + gridSize));
  points.push(new Vector3(x, 0, z - gridSize));

  return points;
}
