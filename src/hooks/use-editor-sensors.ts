
import { useMemo } from "react";
import { MouseSensor, TouchSensor, PointerSensor, SensorDescriptor } from "@dnd-kit/core";

export interface EditorSensor {
  sensor: SensorDescriptor<any>;
  options: {
    activationConstraint: {
      distance: number;
      delay?: number;
      tolerance?: number;
    };
  };
}

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
