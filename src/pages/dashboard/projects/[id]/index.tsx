
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Settings, Share2, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import layoutService, { Layout } from "@/services/layout";
import projectService, { Project } from "@/services/project";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [plotWidth, setPlotWidth] = useState('100');
  const [plotLength, setPlotLength] = useState('100');
  const [shareEmail, setShareEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);

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

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || '');
      setPlotWidth(project.plotWidth?.toString() || '100');
      setPlotLength(project.plotLength?.toString() || '100');
      setSharedUsers(project.sharedWith || []);
    }
  }, [project]);

  const handleUpdateProject = async () => {
    if (!project || !id) return;
    
    try {
      await projectService.updateProject(id as string, {
        ...project,
        name: projectName,
        description: projectDescription,
        plotWidth: Number(plotWidth),
        plotLength: Number(plotLength)
      });
      
      setProject(prev => prev ? {
        ...prev,
        name: projectName,
        description: projectDescription,
        plotWidth: Number(plotWidth),
        plotLength: Number(plotLength)
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

  const handleShareProject = async () => {
    if (!shareEmail || !id) return;

    try {
      await projectService.shareProject(id as string, shareEmail);
      setSharedUsers(prev => [...prev, shareEmail]);
      setShareEmail('');
      toast({
        title: 'Success',
        description: 'Project shared successfully'
      });
    } catch (error) {
      console.error('Error sharing project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to share project'
      });
    }
  };

  const handleRemoveShare = async (email: string) => {
    if (!id) return;

    try {
      await projectService.removeShare(id as string, email);
      setSharedUsers(prev => prev.filter(e => e !== email));
      toast({
        title: 'Success',
        description: 'Access removed successfully'
      });
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove access'
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    
    try {
      await projectService.deleteProject(id as string);
      toast({
        title: 'Success',
        description: 'Project deleted successfully'
      });
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project'
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-lg">Loading project details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-lg">Project not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                    <TabsTrigger value="plot" className="flex-1">Plot Size</TabsTrigger>
                    <TabsTrigger value="sharing" className="flex-1">Sharing</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project Name</label>
                      <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Enter project description"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="plot" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Plot Width (meters)</label>
                      <Input
                        type="number"
                        value={plotWidth}
                        onChange={(e) => setPlotWidth(e.target.value)}
                        placeholder="Enter plot width"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Plot Length (meters)</label>
                      <Input
                        type="number"
                        value={plotLength}
                        onChange={(e) => setPlotLength(e.target.value)}
                        placeholder="Enter plot length"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="sharing" className="space-y-4 py-4">
                    <div className="flex gap-2">
                      <Input
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="Enter email to share with"
                      />
                      <Button 
                        onClick={handleShareProject}
                        className="shrink-0"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Shared With
                      </label>
                      <ScrollArea className="h-[100px] rounded-md border p-2">
                        <div className="space-y-2">
                          {sharedUsers.map((email) => (
                            <div key={email} className="flex items-center justify-between">
                              <span className="text-sm">{email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveShare(email)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex flex-col gap-4 mt-4">
                  <Button 
                    onClick={handleUpdateProject}
                    className="w-full bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
                  >
                    Save Changes
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
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
                          onClick={handleDeleteProject}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DialogContent>
            </Dialog>
            <Link href={`/dashboard/projects/${id}/editor`}>
              <Button className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black">
                <Plus className="h-4 w-4 mr-2" />
                New Layout
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => (
            <Card key={layout.id} className="flex flex-col shadow-lg">
              <CardHeader>
                <CardTitle>{layout.name || 'Untitled Layout'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-muted-foreground min-h-[2.5rem]">
                  {layout.description || 'No description'}
                </p>
                <Link href={`/dashboard/projects/${id}/editor?layout=${layout.id}`}>
                  <Button variant="outline" className="w-full">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Layout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
