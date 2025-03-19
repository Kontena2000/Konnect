
import { useState, useEffect, useCallback, useMemo } from "react";
import { Vector2, Vector3, Mesh, BoxGeometry, MeshStandardMaterial, Raycaster, Plane, Camera } from "three";
import { Module } from "@/types/module";

interface UseDragPreviewReturn {
  previewMesh: Mesh | null;
  previewPosition: [number, number, number];
  setPreviewPosition: (position: [number, number, number]) => void;
  handleDragStart: (module: Module) => void;
  handleDragEnd: () => void;
  updatePreviewPosition: (event: React.DragEvent, camera: Camera, gridSize?: number) => void;
}

export function useDragPreview(): UseDragPreviewReturn {
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [draggedModule, setDraggedModule] = useState<Module | null>(null);

  const raycaster = useMemo(() => new Raycaster(), []);
  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const mouseVector = useMemo(() => new Vector2(), []);

  const handleDragStart = useCallback((module: Module) => {
    setDraggedModule(module);
    
    // Create geometry and center it horizontally, but keep bottom at origin
    const geometry = new BoxGeometry(
      module.dimensions.length,
      module.dimensions.height,
      module.dimensions.width
    );
    geometry.translate(0, module.dimensions.height / 2, 0);
    
    const material = new MeshStandardMaterial({
      color: module.color,
      transparent: true,
      opacity: 0.6,
      wireframe: module.wireframe
    });
    
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Position at ground level
    mesh.position.y = 0;
    setPreviewMesh(mesh);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (previewMesh) {
      if (previewMesh.geometry) previewMesh.geometry.dispose();
      if (previewMesh.material) {
        if (Array.isArray(previewMesh.material)) {
          previewMesh.material.forEach(m => m.dispose());
        } else {
          previewMesh.material.dispose();
        }
      }
    }
    setPreviewMesh(null);
    setDraggedModule(null);
  }, [previewMesh]);

  const updatePreviewPosition = useCallback((event: React.DragEvent, camera: Camera, gridSize: number = 1) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVector, camera);
    const intersection = new Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);

    if (intersection) {
      // Snap to grid and keep at ground level
      const snappedX = Math.round(intersection.x / gridSize) * gridSize;
      const snappedZ = Math.round(intersection.z / gridSize) * gridSize;
      
      setPreviewPosition([snappedX, 0, snappedZ]);
      
      if (previewMesh) {
        // Update preview mesh position
        previewMesh.position.set(snappedX, 0, snappedZ);
      }
    }
  }, [mouseVector, raycaster, groundPlane, previewMesh]);

  useEffect(() => {
    return () => {
      handleDragEnd();
    };
  }, [handleDragEnd]);

  return {
    previewMesh,
    previewPosition,
    setPreviewPosition,
    handleDragStart,
    handleDragEnd,
    updatePreviewPosition
  };
}
