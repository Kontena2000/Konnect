
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Settings } from "lucide-react";
import Link from "next/link";
import layoutService, { Layout } from "@/services/layout";
import projectService, { Project } from "@/services/project";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjectData = async () => {
      if (id) {
        try {
          const projectData = await projectService.getProject(id as string);
          setProject(projectData);
          
          const projectLayouts = await layoutService.getProjectLayouts(id as string);
          setLayouts(projectLayouts);
        } catch (error) {
          console.error("Error loading project:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjectData();
  }, [id]);

  if (loading) {
    return <DashboardLayout>Loading project details...</DashboardLayout>;
  }

  if (!project) {
    return <DashboardLayout>Project not found</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Link href={`/dashboard/projects/${id}/editor`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Layout
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => (
            <Card key={layout.id}>
              <CardHeader>
                <CardTitle>{layout.name || "Untitled Layout"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {layout.description || "No description"}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/projects/${id}/editor?layout=${layout.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
