
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, ZoomIn, ZoomOut } from "lucide-react";

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [modules, setModules] = useState([
    {
      id: "1",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [2, 1, 3],
      color: "#4CAF50"
    },
    {
      id: "2",
      position: [3, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#2196F3"
    }
  ]);

  const handleModuleSelect = (moduleId: string) => {
    console.log("Selected module:", moduleId);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Layout Editor</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-[300px_1fr] gap-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Module Library</h2>
              {/* Add module library components here */}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 h-full">
              <SceneContainer
                modules={modules}
                onModuleSelect={handleModuleSelect}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
