
import { Grid } from "@react-three/drei";
import { Float32BufferAttribute } from "three";

interface GridHelperProps {
  size?: number;
  divisions?: number;
  fadeDistance?: number;
  showAxes?: boolean;
  gridColor?: string;
}

export function GridHelper({
  size = 100,
  divisions = 100,
  fadeDistance = 100,
  showAxes = true,
  gridColor = "#444444"
}: GridHelperProps) {
  const xAxisPoints = new Float32Array([-size / 2, 0.01, 0, size / 2, 0.01, 0]);
  const zAxisPoints = new Float32Array([0, 0.01, -size / 2, 0, 0.01, size / 2]);

  return (
    <>
      <Grid
        args={[size, divisions]}
        position={[0, 0, 0]}
        cellColor={gridColor}
        sectionColor={gridColor}
        fadeDistance={fadeDistance}
        fadeStrength={1}
        infiniteGrid
      />
      
      {showAxes && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={xAxisPoints}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#ff0000" linewidth={2} />
          </line>
          
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={zAxisPoints}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#0000ff" linewidth={2} />
          </line>
        </>
      )}
    </>
  );
}
