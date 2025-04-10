import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { getFirestoreSafely } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calculator, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CalculationDetailsModal } from './CalculationDetailsModal';

interface ProjectCalculationsProps {
  projectId: string;
  onLoadCalculation?: (calculationId: string) => void;
  refreshTrigger?: number; // Add a prop to trigger refresh
}

export function ProjectCalculations({ 
  projectId, 
  onLoadCalculation,
  refreshTrigger = 0
}: ProjectCalculationsProps) {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const { toast } = useToast();
  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null);
  const [calculationModalOpen, setCalculationModalOpen] = useState(false);

  // Define loadCalculations with useCallback to avoid dependency issues
  const loadCalculations = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const db = getFirestoreSafely();
      if (!db) {
        console.error('Firestore not available');
        toast({
          title: 'Error',
          description: 'Could not connect to database',
          variant: 'destructive',
        });
        return;
      }

      console.log('Loading calculations for project:', projectId);

      // Query calculations for this project
      const calculationsRef = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
      const projectQuery = query(
        calculationsRef,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(projectQuery);
      console.log(`Found ${snapshot.docs.length} calculations for project ${projectId}`);
      
      const projectCalculations = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Ensure we have a valid date object for createdAt
        let createdAt;
        try {
          createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        } catch (e) {
          console.error('Error converting timestamp:', e);
          createdAt = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt
        };
      });

      console.log('Project calculations:', projectCalculations);
      setCalculations(projectCalculations);
    } catch (error) {
      console.error('Error loading project calculations:', error);
      toast({
        title: 'Error',
        description: `Failed to load calculations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Load calculations when projectId changes or refreshTrigger changes
  useEffect(() => {
    if (!projectId) return;
    
    console.log('Loading calculations for project ID:', projectId, 'refreshTrigger:', refreshTrigger);
    loadCalculations();
  }, [projectId, refreshTrigger, loadCalculations]);

  const handleLoadCalculation = (calculationId: string) => {
    if (onLoadCalculation) {
      onLoadCalculation(calculationId);
    }
  };

  const handleViewCalculation = (calculationId: string) => {
    setSelectedCalculationId(calculationId);
    setCalculationModalOpen(true);
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Helper function for safe formatting
  const formatNumber = (value: any): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  if (!projectId) {
    return null;
  }

  return (
    <Card className='mt-6'>
      <CardHeader 
        className='cursor-pointer flex flex-row items-center justify-between' 
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className='flex items-center gap-2'>
          <Calculator className='h-5 w-5' />
          Project Calculations
        </CardTitle>
        {expanded ? <ChevronUp className='h-5 w-5' /> : <ChevronDown className='h-5 w-5' />}
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading ? (
            <div className='flex justify-center py-6'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : calculations.length > 0 ? (
            <div className='space-y-4'>
              {calculations.map((calculation) => (
                <div key={calculation.id} className='border rounded-md p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <div>
                      <h3 className='font-medium'>{calculation.name || 'Unnamed Calculation'}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {formatDate(calculation.createdAt)}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewCalculation(calculation.id)}
                        className='hover:bg-[#9333EA]/10'
                      >
                        <Eye className='mr-2 h-4 w-4' />
                        View
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleLoadCalculation(calculation.id)}
                      >
                        Load
                      </Button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-2'>
                    <div>
                      <span className='text-muted-foreground'>Power Density:</span>
                      <span className='ml-2 font-medium'>
                        {calculation.kwPerRack} kW/rack
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Cooling Type:</span>
                      <span className='ml-2 font-medium'>
                        {calculation.coolingType === 'dlc'
                          ? 'Direct Liquid Cooling'
                          : calculation.coolingType === 'air'
                          ? 'Air Cooling'
                          : calculation.coolingType === 'hybrid'
                          ? 'Hybrid Cooling'
                          : 'Immersion Cooling'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Total Racks:</span>
                      <span className='ml-2 font-medium'>
                        {calculation.totalRacks}
                      </span>
                    </div>
                    {calculation.results && calculation.results.cost && (
                      <div className='md:col-span-3'>
                        <span className='text-muted-foreground'>Total Cost:</span>
                        <span className='ml-2 font-medium text-primary'>
                          ${formatNumber(calculation.results.cost.totalProjectCost)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-6 text-muted-foreground'>
              <p>No calculations saved for this project yet.</p>
              <p className='text-sm mt-1'>
                Use the calculator to create and save calculations to this project.
              </p>
            </div>
          )}
          
          <div className='mt-4 flex justify-center'>
            <Button 
              variant='outline' 
              size='sm'
              onClick={loadCalculations}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Refreshing...
                </>
              ) : (
                'Refresh Calculations'
              )}
            </Button>
          </div>
        </CardContent>
      )}

      {/* Calculation Details Modal */}
      {selectedCalculationId && (
        <CalculationDetailsModal
          calculationId={selectedCalculationId}
          isOpen={calculationModalOpen}
          onOpenChange={setCalculationModalOpen}
        />
      )}
    </Card>
  );
}