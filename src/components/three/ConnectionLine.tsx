
import { useRef } from "react";
import { Vector3, Line } from "three";
import { useFrame } from "@react-three/fiber";

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
  const lineRef = useRef<Line>(null);

  const points = [
    new Vector3(...start),
    new Vector3(...end)
  ];

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <float32BufferAttribute 
          attach="attributes-position"
          count={2}
          array={new Float32Array([...start, ...end])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}
