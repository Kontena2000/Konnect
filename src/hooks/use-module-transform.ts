
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

  // Handle transform change - this is used during continuous transform updates
  const handleTransformChange = useCallback((meshRef: React.RefObject<Mesh>, onComplete?: () => void) => {
    if (!meshRef.current || !module || !onUpdate || readOnly) return;

    // Get current position, rotation, and scale from the mesh
    const position: [number, number, number] = [
      Number(meshRef.current.position.x),
      Number(meshRef.current.position.y),
      Number(meshRef.current.position.z)
    ];

    // Convert rotation from radians to degrees for storage
    const rotation: [number, number, number] = [
      Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
      Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
      Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
    ];

    const scale: [number, number, number] = [
      Number(meshRef.current.scale.x),
      Number(meshRef.current.scale.y),
      Number(meshRef.current.scale.z)
    ];

    // Check if position has actually changed to avoid unnecessary updates
    const positionChanged = 
      Math.abs(position[0] - module.position[0]) > 0.001 ||
      Math.abs(position[1] - module.position[1]) > 0.001 ||
      Math.abs(position[2] - module.position[2]) > 0.001;

    const rotationChanged = 
      Math.abs(rotation[0] - module.rotation[0]) > 0.001 ||
      Math.abs(rotation[1] - module.rotation[1]) > 0.001 ||
      Math.abs(rotation[2] - module.rotation[2]) > 0.001;

    const scaleChanged = 
      Math.abs(scale[0] - module.scale[0]) > 0.001 ||
      Math.abs(scale[1] - module.scale[1]) > 0.001 ||
      Math.abs(scale[2] - module.scale[2]) > 0.001;

    // Only update if something has changed
    if (positionChanged || rotationChanged || scaleChanged) {
      console.log('Module transform changed, updating:', module.id, 
        'position:', position, 
        'rotation:', rotation,
        'scale:', scale);
      
      onUpdate({
        position,
        rotation,
        scale
      });
    }

    if (onComplete) {
      onComplete();
    }
  }, [module, onUpdate, readOnly]);

  // This is the original implementation that handles collision detection and snapping
  const handleTransformChangeOriginal = useCallback((meshRef: React.RefObject<Mesh>, updateShadowTransform: () => void) => {
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
          onUpdate: updateShadowTransform,
          onComplete: () => {
            // Always update position after animation completes
            if (onUpdate && meshRef.current) {
              onUpdate({
                position: [
                  Number(meshRef.current.position.x),
                  Number(meshRef.current.position.y),
                  Number(meshRef.current.position.z)
                ]
              });
            }
          }
        });
        
        position.copy(snappedPosition);
      }
      
      if (transformMode === 'rotate') {
        const targetRotation = Math.round(rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        gsap.to(meshRef.current.rotation, {
          y: targetRotation,
          duration: 0.1,
          ease: 'power1.out',
          onUpdate: updateShadowTransform,
          onComplete: () => {
            // Always update rotation after animation completes
            if (onUpdate && meshRef.current) {
              const newRotation: [number, number, number] = [
                Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
                Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
                Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
              ];
              
              console.log('Rotation animation complete, updating to:', newRotation);
              
              onUpdate({
                rotation: newRotation
              });
            }
          }
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
        onUpdate: updateShadowTransform,
        onComplete: () => {
          // Always update position after animation completes
          if (onUpdate && meshRef.current) {
            const finalPosition: [number, number, number] = [
              Number(meshRef.current.position.x), 
              Number(meshRef.current.position.y), 
              Number(meshRef.current.position.z)
            ];
            
            const finalRotation: [number, number, number] = [
              Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)), 
              Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)), 
              Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
            ];
            
            const finalScale: [number, number, number] = [
              Number(meshRef.current.scale.x), 
              Number(meshRef.current.scale.y), 
              Number(meshRef.current.scale.z)
            ];
            
            console.log('Height animation complete, updating to position:', finalPosition, 'rotation:', finalRotation);
            
            onUpdate({
              position: finalPosition,
              rotation: finalRotation,
              scale: finalScale
            });
          }
        }
      });
      adjustedPosition.y = maxCollisionHeight;
    } else {
      gsap.to(meshRef.current.position, {
        y: minHeight,
        duration: 0.15,
        ease: 'power2.out',
        onUpdate: updateShadowTransform,
        onComplete: () => {
          // Always update position after animation completes
          if (onUpdate && meshRef.current) {
            const finalPosition: [number, number, number] = [
              Number(meshRef.current.position.x), 
              Number(meshRef.current.position.y), 
              Number(meshRef.current.position.z)
            ];
            
            const finalRotation: [number, number, number] = [
              Number((meshRef.current.rotation.x * 180 / Math.PI).toFixed(2)), 
              Number((meshRef.current.rotation.y * 180 / Math.PI).toFixed(2)), 
              Number((meshRef.current.rotation.z * 180 / Math.PI).toFixed(2))
            ];
            
            const finalScale: [number, number, number] = [
              Number(meshRef.current.scale.x), 
              Number(meshRef.current.scale.y), 
              Number(meshRef.current.scale.z)
            ];
            
            console.log('Height animation complete, updating to position:', finalPosition, 'rotation:', finalRotation);
            
            onUpdate({
              position: finalPosition,
              rotation: finalRotation,
              scale: finalScale
            });
          }
        }
      });
      adjustedPosition.y = minHeight;
    }
    
    // Update immediately with current position
    const immediatePosition: [number, number, number] = [
      Number(adjustedPosition.x), 
      Number(adjustedPosition.y), 
      Number(adjustedPosition.z)
    ];
    
    const immediateRotation: [number, number, number] = [
      Number((rotation.x * 180 / Math.PI).toFixed(2)), 
      Number((rotation.y * 180 / Math.PI).toFixed(2)), 
      Number((rotation.z * 180 / Math.PI).toFixed(2))
    ];
    
    const immediateScale: [number, number, number] = [
      Number(meshRef.current.scale.x), 
      Number(meshRef.current.scale.y), 
      Number(meshRef.current.scale.z)
    ];
    
    console.log('Immediate update with position:', immediatePosition, 'rotation:', immediateRotation);
    
    onUpdate?.({
      position: immediatePosition,
      rotation: immediateRotation,
      scale: immediateScale
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
    handleTransformChange: handleTransformChangeOriginal
  };
}
