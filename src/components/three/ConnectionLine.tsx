import { useRef } from "react";
import { Vector3, BufferGeometry, LineBasicMaterial, Line } from "three";

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  width?: number;
  capacity?: number;
  onClick?: () => void;
}

export function ConnectionLine({ 
  start, 
  end, 
  color = '#2196F3',
  capacity,
  onClick
}: ConnectionLineProps) {
  const geometry = new BufferGeometry().setFromPoints([
    new Vector3(...start),
    new Vector3(...end)
  ]);
  
  const material = new LineBasicMaterial({ 
    color,
    linewidth: capacity ? Math.min(Math.max(capacity / 100, 1), 3) : 1
  });
  const line = new Line(geometry, material);

  return (
    <primitive 
      object={line} 
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = onClick ? 'pointer' : 'default';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    />
  );
}