
import { useRef } from "react";
import { Vector3, BufferGeometry, Line } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  width?: number;
}

export function ConnectionLine({ 
  start, 
  end, 
  color = "#2196F3",
  width = 2
}: ConnectionLineProps) {
  const lineRef = useRef<Line2>(null);

  const points = [
    new Vector3(...start),
    new Vector3(...end)
  ];

  const geometry = new LineGeometry();
  geometry.setPositions([...start, ...end]);

  const material = new LineMaterial({
    color,
    linewidth: width,
    worldUnits: false,
    dashed: true,
    dashSize: 3,
    gapSize: 1
  });

  return (
    <primitive
      ref={lineRef}
      object={new Line2(geometry, material)}
      computeLineDistances
    />
  );
}
