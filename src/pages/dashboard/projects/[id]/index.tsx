
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Settings, Share, Trash2, Edit, Save, Loader2, LayoutGrid, Calculator, Eye, Calendar, ArrowLeft, FileEdit, Users, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import projectService, { Project } from "@/services/project";
import layoutService, { Layout } from "@/services/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getFirestoreSafely } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { DeleteLayoutDialog } from '@/components/layout/DeleteLayoutDialog';
import { formatDistanceToNow } from 'date-fns';
import { formatDistance } from 'date-fns';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
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

        // Fetch calculations for this project
        try {
          const db = getFirestoreSafely();
          if (!db) {
            console.error('Firestore not available');
            return;
          }
          
          const calculationsQuery = query(
            collection(db, 'matrix_calculator', 'user_configurations', 'configs'),
            where('projectId', '==', id)
          );
          const calculationsSnapshot = await getDocs(calculationsQuery);
          const calculationsData = calculationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCalculations(calculationsData);
        } catch (error) {
          console.error('Error fetching calculations:', error);
        }
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
    if (!project || !id || !user) return;
    
    setSaving(true);
    try {
      await projectService.updateProject(id as string, {
        name: formData.name,
        description: formData.description,
        plotWidth: formData.plotWidth,
        plotLength: formData.plotLength
      }, user.uid);  // Add the missing userId argument
      
      setProject(prev => prev ? {
        ...prev,
        name: formData.name,
        description: formData.description,
        plotWidth: formData.plotWidth,
        plotLength: formData.plotLength
      } : null);
      
      setEditMode(false);
      toast({
        title: 'Success',
        description: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update project'
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
    if (!id || !user) return;
    
    try {
      await projectService.deleteProject(id as string, user.uid);
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
        description: error instanceof Error ? error.message : 'Failed to delete project'
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
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create new layout'
      });
    }
  };

  const handleEditLayout = (layoutId: string) => {
    router.push(`/dashboard/projects/${id}/editor?layoutId=${layoutId}`);
  };
  
  const handleViewLayout = (layoutId: string) => {
    router.push(`/view/${layoutId}`);
  };
  
  const handleDeleteLayout = async (layoutId: string) => {
    if (!user) return;
    
    try {
      await layoutService.deleteLayout(layoutId, user);
      
      // Refresh layouts after deletion
      const projectLayouts = await layoutService.getProjectLayouts(id as string);
      setLayouts(projectLayouts);
      
      toast({
        title: 'Success',
        description: 'Layout deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete layout'
      });
    }
  };

  // Add a new function to refresh layouts
  const refreshLayouts = async () => {
    if (!id) return;
    
    try {
      console.log('Refreshing layouts for project:', id);
      const projectLayouts = await layoutService.getProjectLayouts(id as string);
      console.log('Fetched updated layouts:', projectLayouts.length);
      setLayouts(projectLayouts);
    } catch (error) {
      console.error('Error refreshing layouts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh layouts'
      });
    }
  };
  
  const handleEditCalculation = (calculationId: string) => {
    router.push(`/dashboard/matrix-calculator?calculationId=${calculationId}`);
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
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{project.name}</h1>
            <p className='text-muted-foreground'>{project.description}</p>
          </div>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/projects')}
            className="gap-2"
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Projects
          </Button>
        </div>

        <Separator />

        {/* Project Details Card with integrated actions */}
        <Card className="overflow-hidden border-2 border-muted shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Detailed information about this project</CardDescription>
              </div>
              {!editMode && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditMode(true)}
                    className='bg-[#6E56CF] hover:bg-[#6E56CF]/90 text-white'
                  >
                    <FileEdit className='mr-2 h-4 w-4' />
                    Edit Details
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/projects/${id}/editor`)}
                    className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
                  >
                    <Edit className='mr-2 h-4 w-4' />
                    Open Editor
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-6 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Project ID</h3>
                <p className='font-mono text-sm'>{project.id}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Created</h3>
                <p>{project.createdAt ? new Date((project.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Last Updated</h3>
                <p>{project.updatedAt ? new Date((project.updatedAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}</p>
              </div>
              
              {/* Plot Information */}
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Plot Width</h3>
                <p>{project.plotWidth ? `${project.plotWidth} m` : 'Not specified'}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Plot Length</h3>
                <p>{project.plotLength ? `${project.plotLength} m` : 'Not specified'}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Plot Area</h3>
                <p>{project.plotWidth && project.plotLength ? `${(project.plotWidth * project.plotLength).toFixed(2)} m²` : 'Not specified'}</p>
              </div>
              
              {/* Client Information */}
              {project.clientInfo && (
                <>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>Client Name</h3>
                    <p>{project.clientInfo.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>Client Email</h3>
                    <p>{project.clientInfo.email || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground'>Client Phone</h3>
                    <p>{project.clientInfo.phone || 'Not specified'}</p>
                  </div>
                  {project.clientInfo.address && (
                    <div className='md:col-span-3'>
                      <h3 className='text-sm font-medium text-muted-foreground'>Client Address</h3>
                      <p>{project.clientInfo.address}</p>
                    </div>
                  )}
                </>
              )}
              
              {/* Shared With */}
              {project.sharedWith && project.sharedWith.length > 0 && (
                <div className='md:col-span-3'>
                  <h3 className='text-sm font-medium text-muted-foreground'>Shared With</h3>
                  <div className='flex flex-wrap gap-2 mt-1'>
                    {project.sharedWith.map((email: string) => (
                      <span key={email} className='px-2 py-1 bg-muted rounded-md text-sm'>{email}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Project Actions */}
            {!editMode && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-medium mb-4">Project Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-[#3CB371] hover:bg-[#3CB371]/80 text-white h-auto py-4 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-transparent hover:border-[#3CB371]/30"
                        >
                          <div className="flex flex-col items-center text-center w-full">
                            <Share className="h-8 w-8 mb-2" />
                            <span className="font-medium">Share Project</span>
                            <span className="text-xs mt-1 text-white/70">Collaborate with others</span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share Project</DialogTitle>
                          <DialogDescription>
                            Enter the email address of the user you want to share this project with.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              placeholder="user@example.com" 
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleShareProject} className="bg-[#3CB371] hover:bg-[#3CB371]/80 text-white">
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          className="bg-red-500 hover:bg-red-600/80 text-white h-auto py-4 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-transparent hover:border-red-400"
                        >
                          <div className="flex flex-col items-center text-center w-full">
                            <Trash2 className="h-8 w-8 mb-2" />
                            <span className="font-medium">Delete Project</span>
                            <span className="text-xs mt-1 text-white/70">Remove permanently</span>
                          </div>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            and all associated layouts and calculations.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteProject} className="bg-red-500 hover:bg-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </>
            )}
            
            {editMode && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                <h3 className="text-lg font-medium">Edit Project Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    value={formData.name} 
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description"
                    value={formData.description} 
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plotWidth">Plot Width (m)</Label>
                    <Input 
                      id="plotWidth" 
                      name="plotWidth"
                      type="number" 
                      value={formData.plotWidth} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plotLength">Plot Length (m)</Label>
                    <Input 
                      id="plotLength" 
                      name="plotLength"
                      type="number" 
                      value={formData.plotLength} 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Tabs defaultValue="layouts" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="layouts" className="flex-1 max-w-[200px]">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Layouts
              </TabsTrigger>
              <TabsTrigger value="calculations" className="flex-1 max-w-[200px]">
                <Calculator className="mr-2 h-4 w-4" />
                Calculations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="layouts" className="space-y-4 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Project Layouts</h3>
                <Button 
                  className="bg-[#F1B73A] hover:bg-[#F1B73A]/80 text-black transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                  onClick={() => router.push(`/dashboard/projects/${id}/editor`)}
                >
                  <Plus className="h-4 w-4" />
                  Create New Layout
                </Button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {layouts.length > 0 ? (
                  layouts.map((layout) => (
                    <Card key={layout.id} className="overflow-hidden hover:shadow-md transition-shadow border border-muted">
                      <CardHeader className='pb-2 bg-muted/20'>
                        <CardTitle>{layout.name}</CardTitle>
                        <CardDescription>
                          {layout.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-muted/30">
                            {layout.modules?.length || 0} modules
                          </Badge>
                          <Badge variant="outline" className="bg-muted/30">
                            {layout.connections?.length || 0} connections
                          </Badge>
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                          Last updated: {layout.updatedAt ? new Date((layout.updatedAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}
                        </p>
                      </CardContent>
                      <CardFooter className='flex justify-end gap-2 pt-2 border-t bg-muted/10'>
                        <Button 
                          variant='outline' 
                          size='sm'
                          onClick={() => handleEditLayout(layout.id)}
                          className="hover:bg-[#F1B73A]/10"
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Edit
                        </Button>
                        <Button 
                          variant='outline' 
                          size='sm'
                          onClick={() => handleViewLayout(layout.id)}
                          className="hover:bg-[#9333EA]/10"
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          View
                        </Button>
                        <DeleteLayoutDialog 
                          layoutId={layout.id}
                          layoutName={layout.name}
                          onDeleteComplete={refreshLayouts}
                        />
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className='col-span-full text-center py-12 bg-muted/10 rounded-lg border border-dashed border-muted'>
                    <LayoutGrid className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                    <p className='text-muted-foreground mb-4'>No layouts found for this project</p>
                    <Button 
                      className="bg-[#F1B73A] hover:bg-[#F1B73A]/80 text-black transition-all duration-200 shadow-sm hover:shadow"
                      onClick={() => router.push(`/dashboard/projects/${project.id}/editor`)}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Create First Layout
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="calculations" className="space-y-4 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Project Calculations</h3>
                <Button 
                  className="bg-[#4A7AFF] hover:bg-[#4A7AFF]/80 text-white transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                  onClick={() => router.push(`/dashboard/matrix-calculator?projectId=${id}`)}
                >
                  <Plus className="h-4 w-4" />
                  Create New Calculation
                </Button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {calculations.length > 0 ? (
                  calculations.map((calculation) => (
                    <Card key={calculation.id} className="overflow-hidden hover:shadow-md transition-shadow border border-muted">
                      <CardHeader className='pb-2 bg-muted/20'>
                        <CardTitle>{calculation.name || 'Unnamed Calculation'}</CardTitle>
                        <CardDescription>
                          {calculation.description || `${calculation.kwPerRack || 0}kW per rack, ${calculation.totalRacks || 0} racks`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className='space-y-2'>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-muted/30">
                              Cooling: {calculation.coolingType || calculation.results?.rack?.coolingType || 'Unknown'}
                            </Badge>
                            <Badge variant="outline" className="bg-muted/30">
                              Power: {calculation.kwPerRack || calculation.results?.rack?.powerDensity || 0} kW/rack
                            </Badge>
                          </div>
                          {(calculation.results?.costs?.tco?.total5Years || calculation.results?.cost?.totalProjectCost) && (
                            <p className='text-sm'>
                              <span className='font-medium'>Total Cost:</span> $
                              {calculation.results?.costs?.tco?.total5Years 
                                ? (calculation.results.costs.tco.total5Years / 1000000).toFixed(2) + 'M'
                                : (calculation.results?.cost?.totalProjectCost || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground mt-2'>
                          Created: {calculation.createdAt || calculation.timestamp 
                            ? new Date(((calculation.createdAt || calculation.timestamp) as any)?.seconds * 1000 || Date.now()).toLocaleString() 
                            : 'Unknown'}
                        </p>
                      </CardContent>
                      <CardFooter className='flex justify-end gap-2 pt-2 border-t bg-muted/10'>
                        <Button 
                          variant='outline' 
                          size='sm'
                          onClick={() => handleEditCalculation(calculation.id)}
                          className="hover:bg-[#4A7AFF]/10"
                        >
                          <Calculator className='mr-2 h-4 w-4' />
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className='col-span-full text-center py-12 bg-muted/10 rounded-lg border border-dashed border-muted'>
                    <Calculator className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                    <p className='text-muted-foreground mb-4'>No calculations found for this project</p>
                    <Button 
                      className="bg-[#4A7AFF] hover:bg-[#4A7AFF]/80 text-white transition-all duration-200 shadow-sm hover:shadow"
                      onClick={() => router.push(`/dashboard/matrix-calculator?projectId=${project.id}`)}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Create First Calculation
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
