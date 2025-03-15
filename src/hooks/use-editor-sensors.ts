import { useMemo } from "react";
import { MouseSensor, TouchSensor, PointerSensor, SensorDescriptor, SensorOptions } from "@dnd-kit/core";

export function useEditorSensors() {
  return useMemo(() => [
    {
      sensor: MouseSensor,
      options: {
        activationConstraint: {
          distance: 10,
        },
      },
    } as SensorDescriptor<SensorOptions>,
    {
      sensor: TouchSensor,
      options: {
        activationConstraint: {
          delay: 250,
          tolerance: 5,
        },
      },
    } as SensorDescriptor<SensorOptions>,
    {
      sensor: PointerSensor,
      options: {
        activationConstraint: {
          distance: 8,
        },
      },
    } as SensorDescriptor<SensorOptions>,
  ], []);
}