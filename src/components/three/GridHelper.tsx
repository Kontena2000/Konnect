
import { Grid } from "@react-three/drei";

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
          {/* X-axis */}
          <line>
            <bufferGeometry attach="geometry" args={[new Float32Array([-size / 2, 0, 0, size / 2, 0, 0]), 3]} />
            <lineBasicMaterial attach="material" color="#ff0000" linewidth={2} />
          </line>
          
          {/* Z-axis */}
          <line>
            <bufferGeometry attach="geometry" args={[new Float32Array([0, 0, -size / 2, 0, 0, size / 2]), 3]} />
            <lineBasicMaterial attach="material" color="#0000ff" linewidth={2} />
          </line>
        </>
      )}
    </>
  );
}
