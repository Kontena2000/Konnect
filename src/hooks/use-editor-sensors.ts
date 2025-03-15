
import { useMemo } from "react";
import { MouseSensor, TouchSensor, PointerSensor, useSensors, SensorDescriptor } from "@dnd-kit/core";

export function useEditorSensors() {
  const sensors = useSensors(
    MouseSensor,
    TouchSensor,
    PointerSensor
  );

  return useMemo(() => sensors.map(sensor => ({
    sensor,
    options: {
      activationConstraint: {
        distance: sensor instanceof MouseSensor ? 10 : 8,
        delay: sensor instanceof TouchSensor ? 250 : undefined,
        tolerance: sensor instanceof TouchSensor ? 5 : undefined,
      }
    }
  })) as SensorDescriptor<any>[], [sensors]);
}
