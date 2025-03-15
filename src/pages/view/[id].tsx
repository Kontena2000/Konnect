
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ruler, Eye, MessageSquare, Camera } from "lucide-react";
import { SceneContainer } from "@/components/three/SceneContainer";
import { Layout } from "@/services/layout";
import layoutService from "@/services/layout";
import { ViewControls } from "@/components/viewer/ViewControls";
import { ViewMeasurements } from "@/components/viewer/ViewMeasurements";
import { ViewComments } from "@/components/viewer/ViewComments";

export default function ViewerPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [layout, setLayout] = useState<Layout | null>(null);
  const [activeView, setActiveView] = useState<"normal" | "measure" | "comment">("normal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLayout = async () => {
      if (id) {
        try {
          const layoutData = await layoutService.getLayout(id as string);
          setLayout(layoutData);
        } catch (error) {
          console.error("Error loading layout:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadLayout();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!layout) {
    return <div>Layout not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{layout.name}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === "normal" ? "default" : "outline"}
                size="icon"
                onClick={() => setActiveView("normal")}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === "measure" ? "default" : "outline"}
                size="icon"
                onClick={() => setActiveView("measure")}
              >
                <Ruler className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === "comment" ? "default" : "outline"}
                size="icon"
                onClick={() => setActiveView("comment")}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_300px] gap-4">
            <Card className="h-[800px]">
              <SceneContainer
                modules={layout.modules}
                connections={layout.connections}
                readOnly
              />
            </Card>

            <div className="space-y-4">
              <ViewControls />
              {activeView === "measure" && <ViewMeasurements />}
              {activeView === "comment" && <ViewComments layoutId={layout.id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
