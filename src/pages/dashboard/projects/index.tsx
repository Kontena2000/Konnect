import { useEffect, useState } from "react";
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from "@/contexts/AuthContext";
import projectService, { Project } from "@/services/project";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        const userProjects = await projectService.getUserProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadProjects();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className='h-screen flex items-center justify-center'>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <p>Loading projects...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className='space-y-8'>
        <div className='flex justify-between items-center pb-6 border-b'>
          <h1 className='text-3xl font-bold'>Projects</h1>
          <Link href='/dashboard/projects/new'>
            <Button className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'>
              <Plus className='h-4 w-4 mr-2' />
              New Project
            </Button>
          </Link>
        </div>

        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {projects.map((project) => (
            <Card key={project.id} className='flex flex-col'>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent className='flex-1 space-y-4'>
                <p className='text-sm text-muted-foreground min-h-[2.5rem]'>
                  {project.description || 'No description'}
                </p>
                <div className='space-y-3 pt-4'>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button variant='outline' className='w-full'>
                      Open Project
                    </Button>
                  </Link>
                  <Link href={`/dashboard/projects/${project.id}/editor`}>
                    <Button className='w-full bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'>
                      Open Editor
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