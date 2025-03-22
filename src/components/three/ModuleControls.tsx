
import { Html, Billboard } from "@react-three/drei";
import { PerspectiveCamera, OrthographicCamera } from "three";
import { Mesh } from "three";

interface ModuleControlsProps {
  meshRef: React.RefObject<Mesh>;
  camera: PerspectiveCamera | OrthographicCamera;
  position: [number, number, number];
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete?: () => void;
}

export function ModuleControls({
  meshRef,
  camera,
  position,
  onRotateLeft,
  onRotateRight,
  onDelete
}: ModuleControlsProps) {
  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      position={position}
    >
      <Html
        center
        style={{
          transition: "all 0.2s ease",
          pointerEvents: "auto",
          transform: `scale(${camera.zoom < 1 ? 1 / camera.zoom : 1})`,
          opacity: 0.8
        }}
      >
        <div className="bg-background/80 backdrop-blur-sm p-1 rounded shadow flex gap-1 select-none">
          <button
            className="p-1 hover:bg-accent rounded"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRotateLeft();
            }}
          >
            ⟲
          </button>
          <button
            className="p-1 hover:bg-accent rounded"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRotateRight();
            }}
          >
            ⟳
          </button>
          {onDelete && (
            <button
              className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded ml-2"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              ✕
            </button>
          )}
        </div>
      </Html>
    </Billboard>
  );
}
