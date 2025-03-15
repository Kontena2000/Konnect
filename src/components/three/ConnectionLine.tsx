
import { useRef } from "react";
import { Vector3, BufferGeometry, LineBasicMaterial, Line } from "three";

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  width?: number;
}

export function ConnectionLine({ 
  start, 
  end, 
  color = "#2196F3"
}: ConnectionLineProps) {
  const geometry = new BufferGeometry().setFromPoints([
    new Vector3(...start),
    new Vector3(...end)
  ]);
  
  const material = new LineBasicMaterial({ color });
  const line = new Line(geometry, material);

  return <primitive object={line} />;
}
