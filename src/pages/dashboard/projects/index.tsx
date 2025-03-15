import { useEffect, useState } from "react";
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from "@/contexts/AuthContext";
import projectService, { Project } from "@/services/project";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({
        title: 'Success',
        description: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project'
      });
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        const userProjects = await projectService.getUserProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load projects. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadProjects();
    }
  }, [user, authLoading, toast]);

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
      <div className='container py-8'>
        <div className='flex justify-between items-center mb-8'>
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
            <Card key={project.id} className='flex flex-col h-full shadow-lg'>
              <CardHeader className='pb-4'>
                <div className='flex justify-between items-start'>
                  <CardTitle className='text-xl'>{project.name}</CardTitle>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant='ghost' size='icon' className='text-red-500 hover:text-red-600 hover:bg-red-100'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this project? This action cannot be undone and all layouts will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProject(project.id)}
                          className='bg-red-500 hover:bg-red-600'
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className='flex-1 space-y-6'>
                <p className='text-sm text-muted-foreground min-h-[2.5rem]'>
                  {project.description || 'No description'}
                </p>
                <div className='space-y-4 pt-4'>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button variant='outline' className='w-full mb-3'>
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