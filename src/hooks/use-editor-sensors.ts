
import { useMemo } from "react";
import { MouseSensor, TouchSensor, PointerSensor, useSensor, SensorDescriptor } from "@dnd-kit/core";

export function useEditorSensors() {
  return useMemo(() => [
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      }
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      }
    })
  ] as SensorDescriptor[], []);
}
