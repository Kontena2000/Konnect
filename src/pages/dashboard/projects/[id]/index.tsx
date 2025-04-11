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
import { FileText, Trash2, Edit, Save, Loader2, LayoutGrid, Calculator, Eye, ArrowLeft, Plus, Copy, Building, Mail, Phone, MapPin, Zap, Snowflake, DollarSign, Server, Thermometer } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import projectService, { Project } from "@/services/project";
import layoutService, { Layout } from "@/services/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getFirestoreSafely } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { DeleteLayoutDialog } from '@/components/layout/DeleteLayoutDialog';
import { CalculationDetailsModal } from '@/components/matrix-calculator/CalculationDetailsModal';

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
  const [shareEmail, setShareEmail] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [creatingLayout, setCreatingLayout] = useState(false);
  const [creatingCalculation, setCreatingCalculation] = useState(false);
  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null);
  const [calculationModalOpen, setCalculationModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientCompany: ''
  });

  useEffect(() => {
    const loadProjectData = async () => {
      if (!id || !user) return;
      
      try {
        const projectData = await projectService.getProject(id as string);
        if (!projectData) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Project not found'
          });
          router.push('/dashboard/projects');
          return;
        }
        
        setProject(projectData);
        setFormData({
          name: projectData.name,
          description: projectData.description || '',
          clientName: projectData.clientInfo?.name || '',
          clientEmail: projectData.clientInfo?.email || '',
          clientPhone: projectData.clientInfo?.phone || '',
          clientAddress: projectData.clientInfo?.address || '',
          clientCompany: projectData.clientInfo?.name || '' // Using name as company for now
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
      [name]: value
    }));
  };

  const handleSaveProject = async () => {
    if (!project || !id || !user) return;
    
    setSaving(true);
    try {
      // Create updated clientInfo object
      const updatedClientInfo = {
        name: formData.clientCompany,
        email: formData.clientEmail,
        phone: formData.clientPhone,
        address: formData.clientAddress
      };
      
      await projectService.updateProject(id as string, {
        name: formData.name,
        description: formData.description,
        clientInfo: updatedClientInfo
      }, user.uid);
      
      setProject(prev => prev ? {
        ...prev,
        name: formData.name,
        description: formData.description,
        clientInfo: {
          ...prev.clientInfo,
          name: formData.clientCompany,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          address: formData.clientAddress
        }
      } : null);
      
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

  const handleDuplicateProject = async () => {
    if (!id || !user) return;
    
    setDuplicating(true);
    try {
      const newProjectId = await projectService.duplicateProject(id as string, user.uid);
      toast({
        title: 'Success',
        description: 'Project duplicated successfully'
      });
      router.push(`/dashboard/projects/${newProjectId}`);
    } catch (error) {
      console.error('Error duplicating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to duplicate project'
      });
      setDuplicating(false);
    }
  };

  const createNewLayout = async () => {
    if (!id) return;
    
    setCreatingLayout(true);
    try {
      const layoutId = await layoutService.createLayout({
        projectId: id as string,
        name: "New Layout",
        description: "Created on " + new Date().toLocaleDateString(),
        modules: [],
        connections: []
      });
      
      toast({
        title: 'Success',
        description: 'New layout created successfully'
      });
      
      router.push(`/dashboard/projects/${id}/editor?layoutId=${layoutId}`);
    } catch (error) {
      console.error("Error creating layout:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create new layout'
      });
      setCreatingLayout(false);
    }
  };

  const createNewCalculation = () => {
    setCreatingCalculation(true);
    router.push(`/dashboard/matrix-calculator?projectId=${id}`);
  };

  const handleEditLayout = (layoutId: string) => {
    router.push(`/dashboard/projects/${id}/editor?layoutId=${layoutId}`);
  };
  
  const handleViewLayout = (layoutId: string) => {
    router.push(`/view/${layoutId}`);
  };
  
  // Add a new function to refresh layouts
  const refreshLayouts = async () => {
    if (!id) return;
    
    try {
      const projectLayouts = await layoutService.getProjectLayouts(id as string);
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

  const handleViewCalculation = (calculationId: string) => {
    setSelectedCalculationId(calculationId);
    setCalculationModalOpen(true);
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
            className='gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Projects
          </Button>
        </div>

        <Separator />

        {/* Project Details Card with integrated actions */}
        <Card className='overflow-hidden border-2 border-muted shadow-sm hover:shadow-md transition-all duration-300'>
          <CardHeader className='bg-muted/30 pb-4'>
            <div className='flex justify-between items-center'>
              <div>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Detailed information about this project</CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Button 
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs flex items-center gap-1 bg-white border-[#3CB371] text-[#3CB371] hover:bg-[#3CB371]/10'
                  onClick={() => router.push(`/dashboard/matrix-calculator?projectId=${id}`)}
                >
                  <FileText className='h-3 w-3' />
                  <span>Generate Report</span>
                </Button>
                
                <Button 
                  variant='outline'
                  size='sm'
                  onClick={handleDuplicateProject}
                  disabled={duplicating}
                  className='h-8 text-xs flex items-center gap-1 bg-white border-[#4A7AFF] text-[#4A7AFF] hover:bg-[#4A7AFF]/10'
                >
                  {duplicating ? (
                    <Loader2 className='h-3 w-3 animate-spin' />
                  ) : (
                    <Copy className='h-3 w-3' />
                  )}
                  <span>Duplicate Project</span>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant='outline'
                      size='sm'
                      className='h-8 text-xs flex items-center gap-1 bg-white border-red-500 text-red-500 hover:bg-red-50'
                    >
                      <Trash2 className='h-3 w-3' />
                      <span>Delete Project</span>
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
                      <AlertDialogAction onClick={handleDeleteProject} className='bg-red-500 hover:bg-red-600'>
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Project Name</h3>
                <p className='font-medium'>{project.name}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Description</h3>
                <p>{project.description || 'No description'}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Status</h3>
                <Badge variant='outline' className={`${
                  project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status || 'Planning'}
                </Badge>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Created</h3>
                <p>{project.createdAt ? new Date((project.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}</p>
              </div>
              <div>
                <h3 className='text-sm font-medium text-muted-foreground'>Last Updated</h3>
                <p>{project.updatedAt ? new Date((project.updatedAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}</p>
              </div>
              
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
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Tabs defaultValue='layouts' className='w-full'>
            <TabsList className='w-full justify-start'>
              <TabsTrigger value='layouts' className='flex-1 max-w-[200px]'>
                <LayoutGrid className='mr-2 h-4 w-4' />
                Layouts
              </TabsTrigger>
              <TabsTrigger value='calculations' className='flex-1 max-w-[200px]'>
                <Calculator className='mr-2 h-4 w-4' />
                Calculations
              </TabsTrigger>
              <TabsTrigger value='client-info' className='flex-1 max-w-[200px]'>
                <Building className='mr-2 h-4 w-4' />
                Client Information
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value='layouts' className='space-y-4 mt-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium'>Project Layouts</h3>
                <Button 
                  className='bg-[#F1B73A] hover:bg-[#F1B73A]/80 text-black transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2'
                  onClick={createNewLayout}
                  disabled={creatingLayout}
                >
                  {creatingLayout ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      Create New Layout
                    </>
                  )}
                </Button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {layouts.length > 0 ? (
                  layouts.map((layout) => (
                    <Card key={layout.id} className='overflow-hidden hover:shadow-md transition-shadow border border-muted'>
                      <CardHeader className='pb-2 bg-muted/20'>
                        <CardTitle>{layout.name}</CardTitle>
                        <CardDescription>
                          {layout.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='pt-4'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Badge variant='outline' className='bg-muted/30'>
                            {layout.modules?.length || 0} modules
                          </Badge>
                          <Badge variant='outline' className='bg-muted/30'>
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
                          className='hover:bg-[#F1B73A]/10'
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Edit
                        </Button>
                        <Button 
                          variant='outline' 
                          size='sm'
                          onClick={() => handleViewLayout(layout.id)}
                          className='hover:bg-[#9333EA]/10'
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
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value='calculations' className='space-y-4 mt-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium'>Project Calculations</h3>
                <Button 
                  className='bg-[#F1B73A] hover:bg-[#F1B73A]/80 text-black transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2'
                  onClick={createNewCalculation}
                  disabled={creatingCalculation}
                >
                  {creatingCalculation ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      Create New Calculation
                    </>
                  )}
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4'>
                {calculations.length > 0 ? (
                  calculations.map((calculation) => (
                    <Card key={calculation.id} className='overflow-hidden hover:shadow-md transition-shadow border border-muted'>
                      <CardHeader className='pb-2 bg-muted/20'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <CardTitle>{calculation.name || 'Untitled Calculation'}</CardTitle>
                            <CardDescription>
                              {calculation.description || 'No description'}
                            </CardDescription>
                          </div>
                          <div className='flex gap-2'>
                            <Button 
                              variant='outline' 
                              size='sm'
                              onClick={() => handleEditCalculation(calculation.id)}
                              className='hover:bg-[#F1B73A]/10'
                            >
                              <Edit className='mr-2 h-4 w-4' />
                              Edit
                            </Button>
                            <Button 
                              variant='outline' 
                              size='sm'
                              onClick={() => handleViewCalculation(calculation.id)}
                              className='hover:bg-[#9333EA]/10'
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='pt-4'>
                        {/* Configuration Summary */}
                        <div className='bg-muted/10 p-3 rounded-md mb-4'>
                          <h4 className='text-sm font-medium mb-2 flex items-center gap-1'>
                            <Server className='h-4 w-4 text-muted-foreground' />
                            Configuration Summary
                          </h4>
                          <p className='text-sm'>
                            {calculation.kwPerRack}kW per rack, 
                            {calculation.coolingType === 'dlc' ? ' Direct Liquid Cooling' : 
                             calculation.coolingType === 'air' ? ' Air Cooling' : 
                             calculation.coolingType === 'hybrid' ? ' Hybrid Cooling' : ' Immersion Cooling'}, 
                            {calculation.totalRacks} racks
                          </p>
                        </div>
                        
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                          {/* Total Project Cost */}
                          {calculation.results?.cost && (
                            <div className='bg-muted/10 p-3 rounded-md'>
                              <h4 className='text-sm font-medium mb-2 flex items-center gap-1'>
                                <DollarSign className='h-4 w-4 text-green-600' />
                                Total Project Cost
                              </h4>
                              <p className='text-xl font-bold text-green-600'>
                                ${calculation.results.cost.totalProjectCost.toLocaleString()}
                              </p>
                              <div className='text-xs text-muted-foreground mt-1'>
                                ${(calculation.results.cost.totalProjectCost / calculation.totalRacks).toLocaleString()} per rack
                              </div>
                              {calculation.results.cost.costPerKw && (
                                <div className='text-xs text-muted-foreground'>
                                  ${calculation.results.cost.costPerKw.toLocaleString()} per kW
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Power Requirements */}
                          {calculation.results?.power && (
                            <div className='bg-muted/10 p-3 rounded-md'>
                              <h4 className='text-sm font-medium mb-2 flex items-center gap-1'>
                                <Zap className='h-4 w-4 text-amber-500' />
                                Power Requirements
                              </h4>
                              <p className='text-xl font-bold text-amber-500'>
                                {calculation.results.power.totalPower.toLocaleString()} kW
                              </p>
                              {calculation.results.power.upsModules && (
                                <div className='text-xs text-muted-foreground mt-1'>
                                  {calculation.results.power.upsModules} UPS Modules
                                </div>
                              )}
                              {calculation.results.power.redundancy && (
                                <div className='text-xs text-muted-foreground'>
                                  {calculation.results.power.redundancy} Redundancy
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Cooling Solution */}
                          {calculation.results?.cooling && (
                            <div className='bg-muted/10 p-3 rounded-md'>
                              <h4 className='text-sm font-medium mb-2 flex items-center gap-1'>
                                <Snowflake className='h-4 w-4 text-blue-500' />
                                Cooling Solution
                              </h4>
                              <p className='text-xl font-bold text-blue-500'>
                                {calculation.coolingType === 'hybrid' ? (
                                  <>
                                    {calculation.results.cooling.dlcCapacity?.toLocaleString() || '0'} kW DLC + {calculation.results.cooling.airCapacity?.toLocaleString() || '0'} kW Air
                                  </>
                                ) : (
                                  <>{calculation.results.cooling.coolingCapacity?.toLocaleString() || calculation.results.cooling.totalCapacity?.toLocaleString() || '0'} kW</>
                                )}
                              </p>
                              {calculation.results.cooling.flowRate && (
                                <div className='text-xs text-muted-foreground mt-1'>
                                  {calculation.results.cooling.flowRate.toLocaleString()} L/min Flow Rate
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Additional Details */}
                        <div className='mt-4 text-xs text-muted-foreground'>
                          <div className='flex justify-between'>
                            <span>Created: {calculation.createdAt ? new Date((calculation.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleString() : 'Unknown'}</span>
                            {calculation.updatedAt && (
                              <span>Updated: {new Date((calculation.updatedAt as any)?.seconds * 1000).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className='col-span-full text-center py-12 bg-muted/10 rounded-lg border border-dashed border-muted'>
                    <Calculator className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                    <p className='text-muted-foreground mb-4'>No calculations found for this project</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value='client-info' className='space-y-4 mt-6'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle>Client Information</CardTitle>
                    <CardDescription>Details about the client for this project</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant='outline'
                        size='sm'
                        className='h-8 text-xs flex items-center gap-1 bg-white border-[#F1B73A] text-[#F1B73A] hover:bg-[#F1B73A]/10'
                      >
                        <Edit className='h-3 w-3' />
                        <span>Edit Client Info</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Client Information</DialogTitle>
                        <DialogDescription>
                          Update the client information for this project
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4 py-4'>
                        <div className='grid grid-cols-1 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='clientCompany'>Company Name</Label>
                            <Input
                              id='clientCompany'
                              name='clientCompany'
                              value={formData.clientCompany}
                              onChange={handleInputChange}
                              placeholder='Enter company name'
                            />
                          </div>
                          
                          <div className='space-y-2'>
                            <Label htmlFor='clientEmail'>Email</Label>
                            <Input
                              id='clientEmail'
                              name='clientEmail'
                              type='email'
                              value={formData.clientEmail}
                              onChange={handleInputChange}
                              placeholder='Enter client email'
                            />
                          </div>
                          
                          <div className='space-y-2'>
                            <Label htmlFor='clientPhone'>Phone</Label>
                            <Input
                              id='clientPhone'
                              name='clientPhone'
                              value={formData.clientPhone}
                              onChange={handleInputChange}
                              placeholder='Enter client phone'
                            />
                          </div>
                          
                          <div className='space-y-2'>
                            <Label htmlFor='clientAddress'>Address</Label>
                            <Textarea
                              id='clientAddress'
                              name='clientAddress'
                              value={formData.clientAddress}
                              onChange={handleInputChange}
                              placeholder='Enter client address'
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleSaveProject}
                          disabled={saving}
                          className='bg-[#F1B73A] hover:bg-[#F1B73A]/80 text-black'
                        >
                          {saving ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className='mr-2 h-4 w-4' />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Building className='h-4 w-4 text-muted-foreground' />
                        <h3 className='text-sm font-medium'>Company Name</h3>
                      </div>
                      <p>{project.clientInfo?.name || 'Not specified'}</p>
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Mail className='h-4 w-4 text-muted-foreground' />
                        <h3 className='text-sm font-medium'>Email</h3>
                      </div>
                      <p>{project.clientInfo?.email || 'Not specified'}</p>
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Phone className='h-4 w-4 text-muted-foreground' />
                        <h3 className='text-sm font-medium'>Phone</h3>
                      </div>
                      <p>{project.clientInfo?.phone || 'Not specified'}</p>
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4 text-muted-foreground' />
                        <h3 className='text-sm font-medium'>Address</h3>
                      </div>
                      <p>{project.clientInfo?.address || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Calculation Details Modal */}
      {selectedCalculationId && (
        <CalculationDetailsModal
          calculationId={selectedCalculationId}
          isOpen={calculationModalOpen}
          onOpenChange={setCalculationModalOpen}
        />
      )}
    </AppLayout>
  );
}