
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { TerrainEditor } from "@/components/environment/TerrainEditor";
import { TerrainView } from "@/components/environment/TerrainView";
import { SceneContainer } from "@/components/three/SceneContainer";
import type { TerrainData } from "@/services/environment";
import { useToast } from "@/hooks/use-toast";

export default function TerrainEditorPreview() {
  const { toast } = useToast();
  const controlsRef = useRef<any>(null);
  const [terrain, setTerrain] = useState<TerrainData>({
    id: "preview",
    projectId: "preview",
    points: Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10) - 5,
      y: 0,
      z: Math.floor(i / 10) - 5,
    })),
    resolution: 10,
    dimensions: [50, 50],
    materialType: "soil"
  });

  const handleTerrainUpdate = (updates: Partial<TerrainData>) => {
    setTerrain(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleDropPoint = (point: [number, number, number]) => {
    toast({
      title: "Module dropped",
      description: `Module dropped at position: (${point.join(", ")})`
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terrain Editor Preview</h1>
        
        <div className="grid grid-cols-[400px_1fr] gap-6">
          <TerrainEditor 
            terrain={terrain}
            onUpdate={handleTerrainUpdate}
          />
          
          <Card className="h-[800px]">
            <SceneContainer
              modules={[]}
              terrain={terrain}
              readOnly={false}
              onDropPoint={handleDropPoint}
              gridSnap={true}
              connections={[]}
              environmentalElements={[]}
              controlsRef={controlsRef}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
