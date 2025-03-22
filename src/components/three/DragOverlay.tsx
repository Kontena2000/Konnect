
import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return (
    <DragOverlay dropAnimation={null}>
      <div 
        style={{
          width: "100px",
          height: "100px",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          backgroundColor: template.color,
          opacity: 0.5,
          borderRadius: "4px"
        }}
      />
    </DragOverlay>
  );
}
