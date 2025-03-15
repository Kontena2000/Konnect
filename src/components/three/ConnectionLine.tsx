
import { useRef } from "react";
import { Vector3, BufferGeometry, LineBasicMaterial, Line, TubeGeometry, CatmullRomCurve3, Mesh, MeshStandardMaterial } from "three";

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  intermediatePoints?: [number, number, number][];
  color?: string;
  width?: number;
  capacity?: number;
  onClick?: () => void;
  type?: 'cable' | 'pipe';
}

export function ConnectionLine({ 
  start, 
  end, 
  intermediatePoints = [],
  color = '#2196F3',
  capacity = 1,
  onClick,
  type = 'cable'
}: ConnectionLineProps) {
  const points = [
    new Vector3(...start),
    ...intermediatePoints.map(point => new Vector3(...point)),
    new Vector3(...end)
  ];

  if (type === 'pipe') {
    const curve = new CatmullRomCurve3(points);
    const tubeGeometry = new TubeGeometry(curve, 20, capacity * 0.05, 8, false);
    const tubeMaterial = new MeshStandardMaterial({ 
      color,
      roughness: 0.5,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const tube = new Mesh(tubeGeometry, tubeMaterial);

    return (
      <primitive 
        object={tube} 
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

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({ 
    color,
    linewidth: Math.min(Math.max(capacity * 0.01, 1), 3)
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
