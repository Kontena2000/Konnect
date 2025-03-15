import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Settings } from "lucide-react";
import Link from "next/link";
import layoutService, { Layout } from "@/services/layout";
import projectService, { Project } from "@/services/project";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

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

  const handleUpdateProject = async () => {
    if (!project || !id) return;
    
    try {
      await projectService.updateProject(id as string, {
        ...project,
        name: projectName,
        description: projectDescription
      });
      
      setProject(prev => prev ? {
        ...prev,
        name: projectName,
        description: projectDescription
      } : null);
      
      toast({
        title: 'Success',
        description: 'Project updated successfully'
      });
      
      setIsConfigOpen(false);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update project'
      });
    }
  };

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || '');
    }
  }, [project]);

  if (loading) {
    return <AppLayout>Loading project details...</AppLayout>;
  }

  if (!project) {
    return <AppLayout>Project not found</AppLayout>;
  }

  return (
    <AppLayout>
      <div className='container py-8 space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>{project.name}</h1>
            <p className='text-muted-foreground'>{project.description}</p>
          </div>
          <div className='flex gap-2'>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Settings className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Project Name</label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder='Enter project name'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Description</label>
                    <Input
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder='Enter project description'
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateProject}
                    className='w-full bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
                  >
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link href={`/dashboard/projects/${id}/editor`}>
              <Button className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'>
                <Plus className='h-4 w-4 mr-2' />
                New Layout
              </Button>
            </Link>
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
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
    </AppLayout>
  );
}