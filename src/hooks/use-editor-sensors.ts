
import { useMemo } from "react";
import type { MouseSensor, TouchSensor, PointerSensor, useSensors, SensorDescriptor } from "@dnd-kit/core";

export interface EditorSensor {
  sensor: typeof MouseSensor | typeof TouchSensor | typeof PointerSensor;
  options: {
    activationConstraint: {
      distance: number;
      delay?: number;
      tolerance?: number;
    };
  };
}

export function useEditorSensors(): SensorDescriptor<any>[] {
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
