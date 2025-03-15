
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TerrainEditor } from "@/components/environment/TerrainEditor";
import { TerrainView } from "@/components/environment/TerrainView";
import { SceneContainer } from "@/components/three/SceneContainer";
import type { TerrainData } from "@/services/environment";

export default function TerrainEditorPreview() {
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
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
