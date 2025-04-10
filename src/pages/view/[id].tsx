
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/services/layout";
import layoutService from "@/services/layout";
import { useAuth } from "@/contexts/AuthContext";

export default function ViewerPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLayout = async () => {
      if (id) {
        console.log("Attempting to load layout with ID:", id);
        try {
          // Pass the user to getLayout to handle authentication
          const layoutData = await layoutService.getLayout(id as string, user || undefined);
          console.log("Layout data loaded:", layoutData ? "success" : "null", layoutData);
          setLayout(layoutData);
          if (!layoutData) {
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Layout Not Found</CardTitle>
            <CardDescription>
              {error || "The layout you are looking for could not be found."}
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

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return "Unknown";
    
    // Handle Firestore timestamp
    if (date && typeof date === "object" && "seconds" in date) {
      return new Date(date.seconds * 1000).toLocaleString();
    }
    
    // Handle Date object
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    
    // Try to parse string date
    try {
      return new Date(date).toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Unknown date format";
    }
  };

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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Project ID</h3>
                  <p>{layout.projectId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Last Updated</h3>
                  <p>{formatDate(layout.updatedAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Modules</h3>
                  <p>{layout.modules?.length || 0} modules</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Connections</h3>
                  <p>{layout.connections?.length || 0} connections</p>
                </div>
              </div>
              
              <div className="text-center py-4 mt-4">
                <p className="text-muted-foreground">
                  This is a simplified view of the layout details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
