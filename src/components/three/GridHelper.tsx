
import { Grid } from "@react-three/drei";
import { Float32BufferAttribute } from "three";
import { EditorPreferences } from '@/services/editor-preferences';

interface GridHelperProps {
  size?: number;
  divisions?: number;
  fadeDistance?: number;
  showAxes?: boolean;
  gridColor?: string;
  preferences?: EditorPreferences["grid"] | null;
}

export function GridHelper({
  size = 100,
  divisions = 100,
  fadeDistance = 100,
  showAxes = true,
  gridColor = "#444444",
  preferences
}: GridHelperProps) {
  // Get grid size from preferences or use default
  const getGridSize = () => {
    if (!preferences) return size;
    return preferences.size;
  };

  // Convert line weight to actual value
  const getLineWeight = () => {
    if (!preferences) return 1;
    return parseFloat(preferences.weight);
  };

  const actualSize = getGridSize();
  const xAxisPoints = new Float32Array([-actualSize / 2, 0.01, 0, actualSize / 2, 0.01, 0]);
  const zAxisPoints = new Float32Array([0, 0.01, -actualSize / 2, 0, 0.01, actualSize / 2]);

  return (
    <>
      <Grid
        args={[actualSize, divisions]}
        position={[0, 0, 0]}
        cellColor={preferences?.color || gridColor}
        sectionColor={preferences?.color || gridColor}
        fadeDistance={fadeDistance}
        fadeStrength={1}
        infiniteGrid
        cellSize={getLineWeight()}
        sectionSize={getLineWeight() * 5}
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
            <lineBasicMaterial attach="material" color="#ff0000" linewidth={getLineWeight() * 2} />
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
            <lineBasicMaterial attach="material" color="#0000ff" linewidth={getLineWeight() * 2} />
          </line>
        </>
      )}
    </>
  );
}
