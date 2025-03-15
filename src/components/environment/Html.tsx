
import { ReactNode } from "react";
import { useThree, Vector3 } from "@react-three/fiber";
import { Html as DreiHtml } from "@react-three/drei";

interface HtmlProps {
  children: ReactNode;
  position?: Vector3 | [number, number, number];
  className?: string;
}

export function Html({ children, position, className }: HtmlProps) {
  const { camera } = useThree();

  return (
    <DreiHtml
      position={position}
      transform
      occlude
      distanceFactor={10}
      className={className}
    >
      {children}
    </DreiHtml>
  );
}
