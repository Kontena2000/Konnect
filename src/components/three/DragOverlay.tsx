import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";
import * as THREE from 'three';

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return (
    <DragOverlay>
      <div style={{
        width: template.dimensions.length * 50,
        height: template.dimensions.width * 50,
        backgroundColor: template.color,
        opacity: 0.5,
        border: '2px solid rgba(255,255,255,0.5)',
        borderRadius: '4px',
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)'
      }} />
    </DragOverlay>
  );
}