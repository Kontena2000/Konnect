import { useState, useEffect } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Settings } from "lucide-react";
import { CalculatorComponent } from "@/components/matrix-calculator/CalculatorComponent";
import { SavedCalculations } from "@/components/SavedCalculations";
import { getFirestoreSafely } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { FirebaseDebugger } from '@/components/matrix-calculator/FirebaseDebugger';
import { waitForMatrixCalculatorBootstrap } from '@/utils/matrixCalculatorBootstrap';
import { useToast } from '@/hooks/use-toast';
import { runMatrixCalculatorInitialization } from '@/services/matrixCalculatorInitializer';
import { PricingDebugger } from '@/components/matrix-calculator/PricingDebugger';
import { CalculatorDebugger } from '@/components/matrix-calculator/CalculatorDebugger';

export default function MatrixCalculatorPage() {
  const router = useRouter();
  const { calculationId, projectId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [calculation, setCalculation] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [initialResults, setInitialResults] = useState<any>(null);
  const [loadingCalculation, setLoadingCalculation] = useState(false);

  useEffect(() => {
    const initializeMatrixCalculator = async () => {
      try {
        // Initialize Matrix Calculator collections and documents
        const initialized = await runMatrixCalculatorInitialization();
        if (!initialized) {
          console.error('Failed to initialize Matrix Calculator');
        } else {
          console.log('Matrix Calculator initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing Matrix Calculator:', error);
      }
    };

    // Run initialization when the component mounts
    initializeMatrixCalculator();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Ensure Matrix Calculator is bootstrapped
        await waitForMatrixCalculatorBootstrap();
        const db = getFirestoreSafely();
        
        if (!db) {
          setError('Firebase database is not available');
          return;
        }
        
        // If projectId is provided, fetch project data
        if (projectId) {
          const projectRef = doc(db, 'projects', projectId as string);
          const projectSnap = await getDoc(projectRef);
          
          if (projectSnap.exists()) {
            const projectData = {
              id: projectSnap.id,
              ...projectSnap.data()
            } as any; // Cast to any to avoid TypeScript errors
            
            // Check if user has access to this project
            const projectUserId = projectData.userId || '';
            const projectSharedWith = projectData.sharedWith || [];
            
            if (projectUserId !== user.uid && 
                (!projectSharedWith.includes(user.email)) && 
                user.email !== 'ruud@kontena.eu') {
              setError('You do not have access to this project');
              return;
            }
            
            setProject(projectData);
          } else {
            setError('Project not found');
            return;
          }
        }
        
        // If calculationId is provided, fetch the calculation
        if (calculationId) {
          loadCalculation(calculationId as string);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [calculationId, projectId, user]);

  const loadCalculation = async (calculationId: string) => {
    setLoadingCalculation(true);
    try {
      const db = getFirestoreSafely();
      if (!db) {
        toast({
          title: 'Error',
          description: 'Could not connect to database',
          variant: 'destructive',
        });
        return;
      }
      
      const calculationRef = doc(db, 'matrix_calculator', 'user_configurations', 'configs', calculationId);
      const calculationSnap = await getDoc(calculationRef);
      
      if (calculationSnap.exists()) {
        const calculationData = calculationSnap.data();
        setInitialResults(calculationData.results);
        
        toast({
          title: 'Calculation Loaded',
          description: `Loaded calculation: ${calculationData.name || 'Unnamed Calculation'}`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Calculation not found',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading calculation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calculation',
        variant: 'destructive',
      });
    } finally {
      setLoadingCalculation(false);
    }
  };

  const handleSaveCalculation = (savedCalculation: any) => {
    toast({
      title: 'Calculation Saved',
      description: 'Your calculation has been saved successfully.',
    });
    
    // If we have a projectId in the URL, refresh the page to show the updated calculations
    const { projectId } = router.query;
    if (projectId && typeof projectId === 'string') {
      router.push(`/dashboard/projects/${projectId}?tab=calculations`);
    }
  };
  
  const handleLoadCalculation = (calculationId: string) => {
    console.log('Loading calculation:', calculationId);
    // Instead of directly loading the calculation, redirect to the page with the calculationId
    router.push(`/dashboard/matrix-calculator?calculationId=${calculationId}`);
  };

  if (loading) {
    return (
      <div className='container mx-auto p-4 space-y-4'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-[600px] w-full' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto p-4'>
        <div className='bg-destructive/10 p-4 rounded-md'>
          <h2 className='text-lg font-medium text-destructive'>Error</h2>
          <p>{error}</p>
          <Button 
            variant='outline' 
            className='mt-4'
            onClick={() => router.push('/dashboard/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Matrix Calculator | Konnect</title>
        <meta name="description" content="Calculate data center infrastructure requirements" />
      </Head>

      <div className="w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calculator className="h-8 w-8" />
              {calculation ? 'Edit Calculation' : 'Matrix Calculator'}
            </h1>
            {project && (
              <p className='text-muted-foreground'>
                Project: {project.name}
              </p>
            )}
          </div>

          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/settings?tab=matrix-calculator')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Calculator Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {user && (
            <>
              <CalculatorComponent 
                userId={user?.uid || ''} 
                userRole={user?.role || 'user'} 
                initialResults={initialResults}
                onSave={handleSaveCalculation}
              />
              <SavedCalculations 
                userId={user.uid} 
                onLoadCalculation={handleLoadCalculation} 
              />
              <PricingDebugger />
              <CalculatorDebugger />
            </>
          )}
        </div>
        <FirebaseDebugger />
      </div>
    </AppLayout>
  );
}