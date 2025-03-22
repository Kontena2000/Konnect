import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";
import * as THREE from 'three';

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return null; // Don't render 2D overlay, we'll use 3D preview instead
}