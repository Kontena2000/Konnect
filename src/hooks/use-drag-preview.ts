
import { useState, useEffect, useCallback } from "react";
import { Vector2, Vector3, Mesh, BoxGeometry, MeshStandardMaterial } from "three";
import { Module } from "@/types/module";

interface UseDragPreviewReturn {
  previewMesh: Mesh | null;
  previewPosition: [number, number, number];
  setPreviewPosition: (position: [number, number, number]) => void;
  handleDragStart: (module: Module) => void;
  handleDragEnd: () => void;
}

export function useDragPreview(): UseDragPreviewReturn {
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [draggedModule, setDraggedModule] = useState<Module | null>(null);

  const handleDragStart = useCallback((module: Module) => {
    setDraggedModule(module);
    const geometry = new BoxGeometry(
      module.dimensions.length,
      module.dimensions.height,
      module.dimensions.width
    );
    const material = new MeshStandardMaterial({
      color: module.color,
      transparent: true,
      opacity: 0.6,
      wireframe: module.wireframe
    });
    const mesh = new Mesh(geometry, material);
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
    handleDragEnd
  };
}
