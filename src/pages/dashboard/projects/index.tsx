import { useEffect, useState } from "react";
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from "@/contexts/AuthContext";
import projectService, { Project } from "@/services/project";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      if (user) {
        try {
          const userProjects = await projectService.getUserProjects(user.uid);
          setProjects(userProjects);
        } catch (error) {
          console.error("Error loading projects:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjects();
  }, [user]);

  if (loading) {
    return <AppLayout>Loading projects...</AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.description || "No description"}
                </p>
                <div className="mt-4">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button variant="outline" className="w-full">
                      Open Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}