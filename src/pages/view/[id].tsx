
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/services/layout";
import layoutService from "@/services/layout";

export default function ViewerPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [layout, setLayout] = useState<Layout | null>(null);
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

  if (!layout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Layout Not Found</CardTitle>
            <CardDescription>
              The layout you are looking for could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{layout.name}</CardTitle>
                <CardDescription>
                  {layout.description || "No description available"}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={handleBackToProject}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                This is a simplified view of the layout details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
