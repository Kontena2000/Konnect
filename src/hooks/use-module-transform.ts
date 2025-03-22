
import { useCallback, useState } from "react";
import { Vector3, Euler, Mesh, Box3 } from "three";
import * as THREE from "three";
import { Module } from "@/types/module";
import gsap from "gsap";

interface UseModuleTransformProps {
  module: Module;
  modules?: Module[];
  gridSnap?: boolean;
  readOnly?: boolean;
  transformMode?: "translate" | "rotate" | "scale";
  onUpdate?: (updates: Partial<Module>) => void;
}

export function useModuleTransform({
  module,
  modules = [],
  gridSnap = true,
  readOnly = false,
  transformMode = "translate",
  onUpdate
}: UseModuleTransformProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  const handleTransformChange = useCallback((meshRef: React.RefObject<Mesh>, updateShadowTransform: () => void) => {
    if (!meshRef.current || readOnly) return;
    
    const position = meshRef.current.position.clone();
    const rotation = meshRef.current.rotation.clone();
    
    const minHeight = module.dimensions.height / 2;
    position.y = Math.max(position.y, minHeight);
    
    if (gridSnap && !isShiftPressed && !isTransforming) {
      if (transformMode === 'translate') {
        const snappedPosition = new Vector3(
          Math.round(position.x),
          position.y,
          Math.round(position.z)
        );
        
        gsap.to(meshRef.current.position, {
          x: snappedPosition.x,
          z: snappedPosition.z,
          duration: 0.1,
          ease: 'power1.out',
          onUpdate: updateShadowTransform
        });
        
        position.copy(snappedPosition);
      }
      
      if (transformMode === 'rotate') {
        const targetRotation = Math.round(rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        gsap.to(meshRef.current.rotation, {
          y: targetRotation,
          duration: 0.1,
          ease: 'power1.out',
          onUpdate: updateShadowTransform
        });
        rotation.y = targetRotation;
      }
    }
    
    const box = new Box3().setFromObject(meshRef.current);
    let adjustedPosition = position.clone();
    let maxCollisionHeight = minHeight;
    
    modules.forEach(otherModule => {
      if (otherModule.id === module.id) return;
      
      const otherBox = new Box3();
      const otherPos = new Vector3(...otherModule.position);
      const otherSize = new Vector3(
        otherModule.dimensions.length,
        otherModule.dimensions.height,
        otherModule.dimensions.width
      );
      otherBox.setFromCenterAndSize(otherPos, otherSize);
      
      const xzIntersection = (
        box.min.x <= otherBox.max.x &&
        box.max.x >= otherBox.min.x &&
        box.min.z <= otherBox.max.z &&
        box.max.z >= otherBox.min.z
      );
      
      if (xzIntersection) {
        const collisionHeight = otherPos.y + otherModule.dimensions.height/2 + module.dimensions.height/2;
        maxCollisionHeight = Math.max(maxCollisionHeight, collisionHeight);
      }
    });
    
    if (maxCollisionHeight > minHeight) {
      gsap.to(meshRef.current.position, {
        y: maxCollisionHeight,
        duration: 0.15,
        ease: 'power2.out',
        onUpdate: updateShadowTransform
      });
      adjustedPosition.y = maxCollisionHeight;
    } else {
      gsap.to(meshRef.current.position, {
        y: minHeight,
        duration: 0.15,
        ease: 'power2.out',
        onUpdate: updateShadowTransform
      });
      adjustedPosition.y = minHeight;
    }
    
    onUpdate?.({
      position: [adjustedPosition.x, adjustedPosition.y, adjustedPosition.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
    });
    
    updateShadowTransform();
  }, [
    readOnly, onUpdate, module.id, module.dimensions,
    gridSnap, isShiftPressed, transformMode, isTransforming, 
    modules
  ]);

  return {
    isShiftPressed,
    setIsShiftPressed,
    isTransforming,
    setIsTransforming,
    handleTransformChange
  };
}
