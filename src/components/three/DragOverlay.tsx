
import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  // Return null to hide the default drag overlay since we're showing the 3D preview
  return null;
}
