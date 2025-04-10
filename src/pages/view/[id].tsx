import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/services/layout";
import layoutService from "@/services/layout";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";

export default function ViewerPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const loadLayout = async () => {
      if (id) {
        console.log("Attempting to load layout with ID:", id);
        try {
          // Pass the user to getLayout to handle authentication
          const layoutData = await layoutService.getLayout(id as string, user || undefined);
          console.log("Layout data loaded:", layoutData ? "success" : "null", layoutData);
          
          if (layoutData) {
            setLayout(layoutData);
            console.log("Layout set in state:", layoutData.name, "with", 
              layoutData.modules?.length || 0, "modules and", 
              layoutData.connections?.length || 0, "connections");
          } else {
            console.error("Layout data is null");
            setError("Layout not found or you do not have permission to view it.");
          }
        } catch (err) {
          console.error("Error loading layout:", err);
          setError(err instanceof Error ? err.message : "Failed to load layout");
        } finally {
          setLoading(false);
        }
      }
    };

    loadLayout();
  }, [id, user]);

  const handleBackToProject = () => {
    if (layout && layout.projectId) {
      router.push(`/dashboard/projects/${layout.projectId}`);
    } else {
      router.push("/dashboard/projects");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading layout...</p>
        </div>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Layout Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The layout you are looking for could not be found."}
          </p>
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullWidth>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{layout.name}</h1>
            <p className="text-muted-foreground">{layout.description || "No description available"}</p>
          </div>
          <Button onClick={handleBackToProject}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
        
        <div className="flex flex-1 gap-4 h-[calc(100vh-120px)]">
          <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
            <SceneContainer
              modules={layout.modules || []}
              connections={layout.connections || []}
              readOnly={true}
              controlsRef={controlsRef}
            />
          </div>
          
          <div className="w-80 shrink-0">
          </div>
        </div>
      </div>
    </AppLayout>
  );
}