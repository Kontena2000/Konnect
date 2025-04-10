import { useEffect, useState, useCallback } from "react";
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
import { Settings, Share, Trash2, Edit, Save, Loader2, LayoutGrid, Calculator, Eye, Calendar } from "lucide-react";
import projectService, { Project } from "@/services/project";
import layoutService, { Layout } from "@/services/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getFirestoreSafely } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { DeleteLayoutDialog } from '@/components/layout/DeleteLayoutDialog';
import { formatDistanceToNow } from 'date-fns';

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
  
  const [calculationsRefreshTrigger, setCalculationsRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('layouts');

  // Refresh calculations function with better error handling
  const refreshCalculations = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log('Refreshing calculations for project:', id);
      const db = getFirestoreSafely();
      if (!db) {
        console.error('Firestore not available');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not connect to database'
        });
        return;
      }
      
      // Create a direct reference to the configs subcollection
      const calculationsRef = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
      const calculationsQuery = query(
        calculationsRef,
        where('projectId', '==', id),
        orderBy('createdAt', 'desc')
      );
      
      const calculationsSnapshot = await getDocs(calculationsQuery);
      console.log(`Found ${calculationsSnapshot.docs.length} calculations for project ${id}`);
      
      const calculationsData = calculationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });
      
      setCalculations(calculationsData);
      setCalculationsRefreshTrigger(prev => prev + 1);
      
      if (calculationsData.length > 0) {
        console.log('First calculation:', calculationsData[0]);
      }
    } catch (error) {
      console.error('Error refreshing calculations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh calculations'
      });
    }
  }, [id, toast]);

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
        await refreshCalculations();
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
  }, [id, user, router, toast, refreshCalculations]);

  // Check for tab parameter in URL
  useEffect(() => {
    if (router.query.tab === 'calculations') {
      setActiveTab('calculations');
    }
  }, [router.query.tab]);

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
        title: "Error",
        description: "Failed to create new layout"
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
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/projects')}
            >
              Back to Projects
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/projects/${id}/editor`)}
              className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
            >
              <Edit className='mr-2 h-4 w-4' />
              Open Editor
            </Button>
          </div>
        </div>

        <Separator />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='md:col-span-3 space-y-6'>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="layouts">Layouts</TabsTrigger>
                <TabsTrigger value="calculations">Calculations</TabsTrigger>
                <TabsTrigger value="details">Project Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="layouts" className="space-y-4">
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {layouts.length > 0 ? (
                    layouts.map((layout) => (
                      <Card key={layout.id}>
                        <CardHeader className='pb-2'>
                          <CardTitle>{layout.name}</CardTitle>
                          <CardDescription>
                            {layout.description || 'No description'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className='text-sm'>
                            {layout.modules?.length || 0} modules, {layout.connections?.length || 0} connections
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Last updated: {layout.updatedAt ? new Date((layout.updatedAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}
                          </p>
                        </CardContent>
                        <CardFooter className='flex justify-end gap-2'>
                          <Button 
                            variant='outline' 
                            size='sm'
                            onClick={() => handleEditLayout(layout.id)}
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                          </Button>
                          <Button 
                            variant='outline' 
                            size='sm'
                            onClick={() => handleViewLayout(layout.id)}
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
                    <div className='col-span-full text-center py-8'>
                      <p className='text-muted-foreground'>No layouts found for this project</p>
                      <Button 
                        variant='outline' 
                        className='mt-4'
                        onClick={() => router.push(`/dashboard/projects/${project.id}/editor`)}
                      >
                        <LayoutGrid className='mr-2 h-4 w-4' />
                        Create Layout
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="calculations" className="space-y-4">
                <div className='flex justify-end mb-4'>
                  <Button 
                    variant='outline' 
                    size='sm'
                    onClick={refreshCalculations}
                    className='mr-2'
                  >
                    <Loader2 className='mr-2 h-4 w-4' />
                    Refresh Calculations
                  </Button>
                  <Button 
                    onClick={() => router.push(`/dashboard/matrix-calculator?projectId=${project.id}`)}
                    className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
                  >
                    <Calculator className='mr-2 h-4 w-4' />
                    New Calculation
                  </Button>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {calculations.length > 0 ? (
                    calculations.map((calculation) => (
                      <Card key={calculation.id}>
                        <CardHeader className='pb-2'>
                          <CardTitle>{calculation.name || 'Unnamed Calculation'}</CardTitle>
                          <CardDescription>
                            {calculation.description || `${calculation.kwPerRack}kW per rack, ${calculation.totalRacks} racks`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-1'>
                            <p className='text-sm'>
                              <span className='font-medium'>Cooling:</span> {calculation.coolingType || calculation.results?.rack?.coolingType || 'Unknown'}
                            </p>
                            <p className='text-sm'>
                              <span className='font-medium'>Power:</span> {calculation.kwPerRack || calculation.results?.rack?.powerDensity || 0} kW/rack
                            </p>
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
                            Created: {calculation.createdAt 
                              ? new Date(calculation.createdAt instanceof Date 
                                  ? calculation.createdAt 
                                  : (calculation.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleString() 
                              : 'Unknown'}
                          </p>
                        </CardContent>
                        <CardFooter className='flex justify-end gap-2'>
                          <Button 
                            variant='outline' 
                            size='sm'
                            onClick={() => handleEditCalculation(calculation.id)}
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            View
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className='col-span-full text-center py-8'>
                      <p className='text-muted-foreground'>No calculations found for this project</p>
                      <Button 
                        variant='outline' 
                        className='mt-4'
                        onClick={() => router.push(`/dashboard/matrix-calculator?projectId=${project.id}`)}
                      >
                        <Calculator className='mr-2 h-4 w-4' />
                        Create Calculation
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h3 className='text-sm font-medium'>Project Name</h3>
                        <p>{project.name}</p>
                      </div>
                      <div>
                        <h3 className='text-sm font-medium'>Created</h3>
                        <p>{project.createdAt ? new Date((project.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}</p>
                      </div>
                      <div className='md:col-span-2'>
                        <h3 className='text-sm font-medium'>Description</h3>
                        <p>{project.description || 'No description'}</p>
                      </div>
                      {(project as any).client && (
                        <>
                          <div>
                            <h3 className='text-sm font-medium'>Client Name</h3>
                            <p>{(project as any).client.name || 'Not specified'}</p>
                          </div>
                          <div>
                            <h3 className='text-sm font-medium'>Client Contact</h3>
                            <p>{(project as any).client.contact || 'Not specified'}</p>
                          </div>
                        </>
                      )}
                      {project.sharedWith && project.sharedWith.length > 0 && (
                        <div className='md:col-span-2'>
                          <h3 className='text-sm font-medium'>Shared With</h3>
                          <ul className='list-disc list-inside'>
                            {project.sharedWith.map((email: string) => (
                              <li key={email}>{email}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}