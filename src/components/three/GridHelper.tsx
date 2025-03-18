
import { Grid } from "@react-three/drei";
import { BufferGeometry } from "three";

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
              <float32BufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-size / 2, 0.01, 0, size / 2, 0.01, 0]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#ff0000" linewidth={2} />
          </line>
          
          <line>
            <bufferGeometry>
              <float32BufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, 0.01, -size / 2, 0, 0.01, size / 2]), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#0000ff" linewidth={2} />
          </line>
        </>
      )}
    </>
  );
}
