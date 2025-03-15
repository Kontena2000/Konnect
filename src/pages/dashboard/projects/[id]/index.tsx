import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings, Share, Trash2, Edit, Save, Loader2 } from "lucide-react";
import projectService, { Project } from "@/services/project";
import layoutService, { Layout } from "@/services/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plotWidth: 0,
    plotLength: 0
  });

  useEffect(() => {
    const loadProjectData = async () => {
      if (!id || !user) return;
      
      try {
        const projectData = await projectService.getProject(id as string);
        if (!projectData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Project not found"
          });
          router.push("/dashboard/projects");
          return;
        }
        
        setProject(projectData);
        setFormData({
          name: projectData.name,
          description: projectData.description || "",
          plotWidth: projectData.plotWidth || 0,
          plotLength: projectData.plotLength || 0
        });
        
        const projectLayouts = await layoutService.getProjectLayouts(id as string);
        setLayouts(projectLayouts);
      } catch (error) {
        console.error("Error loading project:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load project data"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProjectData();
  }, [id, user, router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "plotWidth" || name === "plotLength" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSaveProject = async () => {
    if (!project || !id) return;
    
    setSaving(true);
    try {
      await projectService.updateProject(id as string, {
        name: formData.name,
        description: formData.description,
        plotWidth: formData.plotWidth,
        plotLength: formData.plotLength
      });
      
      setProject(prev => prev ? {
        ...prev,
        name: formData.name,
        description: formData.description,
        plotWidth: formData.plotWidth,
        plotLength: formData.plotLength
      } : null);
      
      setEditMode(false);
      toast({
        title: "Success",
        description: "Project updated successfully"
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShareProject = async () => {
    if (!id || !shareEmail) return;
    
    try {
      await projectService.shareProject(id as string, shareEmail);
      toast({
        title: "Success",
        description: `Project shared with ${shareEmail}`
      });
      setShareEmail("");
    } catch (error) {
      console.error("Error sharing project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to share project"
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    
    try {
      await projectService.deleteProject(id as string);
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete project"
      });
    }
  };

  const createNewLayout = async () => {
    if (!id) return;
    
    try {
      const layoutId = await layoutService.createLayout({
        projectId: id as string,
        name: "New Layout",
        description: "Created on " + new Date().toLocaleDateString(),
        modules: [],
        connections: []
      });
      
      router.push(`/dashboard/projects/${id}/editor?layout=${layoutId}`);
    } catch (error) {
      console.error("Error creating layout:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new layout"
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <AppLayout>
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>{project.name}</h1>
            <p className='text-muted-foreground'>{project.description}</p>
          </div>
          
          <div className='flex items-center gap-3'>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Share className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Project</DialogTitle>
                  <DialogDescription>
                    Enter an email address to share this project with a collaborator.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="collaborator@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleShareProject}>Share</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Settings className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                  <DialogDescription>
                    Configure project settings and properties.
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='plotWidth'>Plot Width (m)</Label>
                    <Input
                      id='plotWidth'
                      name='plotWidth'
                      type='number'
                      value={formData.plotWidth || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='plotLength'>Plot Length (m)</Label>
                    <Input
                      id='plotLength'
                      name='plotLength'
                      type='number'
                      value={formData.plotLength || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveProject}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='outline' size='icon' className='text-red-500 hover:text-red-600 hover:bg-red-100'>
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
                    onClick={handleDeleteProject}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Project Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? (
                      <Save className="h-4 w-4 mr-2" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    {editMode ? "Save" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProject}
                        disabled={saving}
                      >
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Project Name</h3>
                      <p>{project.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                      <p>{project.description || "No description"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Plot Dimensions</h3>
                      <p>
                        {project.plotWidth && project.plotLength
                          ? `${project.plotWidth}m × ${project.plotLength}m`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="layouts" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Layouts</h2>
              <Button 
                className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
                onClick={createNewLayout}
              >
                Create New Layout
              </Button>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {layouts.length > 0 ? (
                layouts.map((layout) => (
                  <Card key={layout.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{layout.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground mb-4">
                        {layout.description || "No description"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {layout.updatedAt.toLocaleString()}
                      </p>
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Link href={`/dashboard/projects/${id}/editor?layout=${layout.id}`}>
                        <Button className="w-full bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black">
                          Open Layout
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No layouts created yet.</p>
                  <Button 
                    className="mt-4 bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
                    onClick={createNewLayout}
                  >
                    Create Your First Layout
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}