
import { useMemo } from "react";
import { MouseSensor, TouchSensor, PointerSensor } from "@dnd-kit/core";

export function useEditorSensors() {
  return useMemo(() => [
    {
      sensor: MouseSensor,
      options: {
        activationConstraint: {
          distance: 10,
        },
      },
    },
    {
      sensor: TouchSensor,
      options: {
        activationConstraint: {
          delay: 250,
          tolerance: 5,
        },
      },
    },
    {
      sensor: PointerSensor,
      options: {
        activationConstraint: {
          distance: 8,
        },
      },
    },
  ], []);
}
