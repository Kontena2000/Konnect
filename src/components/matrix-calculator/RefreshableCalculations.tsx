import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { getFirestoreSafely } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit } from "lucide-react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

interface RefreshableCalculationsProps {
  projectId: string;
  refreshTrigger?: number;
}

export function RefreshableCalculations({ 
  projectId,
  refreshTrigger = 0
}: RefreshableCalculationsProps) {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Load calculations function with useCallback to avoid dependency issues
  const loadCalculations = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      console.log('Loading calculations for project:', projectId);
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
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const calculationsSnapshot = await getDocs(calculationsQuery);
      console.log(`Found ${calculationsSnapshot.docs.length} calculations for project ${projectId}`);
      
      const calculationsData = calculationsSnapshot.docs.map(doc => {
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
      
      console.log('Calculations data:', calculationsData);
      setCalculations(calculationsData);
    } catch (error) {
      console.error('Error loading calculations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load calculations'
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

  const handleEditCalculation = (calculationId: string) => {
    router.push(`/dashboard/matrix-calculator?calculationId=${calculationId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="col-span-full text-center py-8">
        <p className="text-muted-foreground">No calculations found for this project</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push(`/dashboard/matrix-calculator?projectId=${projectId}`)}
        >
          Create Calculation
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {calculations.map((calculation) => (
        <Card key={calculation.id}>
          <CardHeader className="pb-2">
            <CardTitle>{calculation.name || 'Unnamed Calculation'}</CardTitle>
            <CardDescription>
              {calculation.description || `${calculation.kwPerRack}kW per rack, ${calculation.totalRacks} racks`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Cooling:</span> {calculation.coolingType || calculation.results?.rack?.coolingType || 'Unknown'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Power:</span> {calculation.kwPerRack || calculation.results?.rack?.powerDensity || 0} kW/rack
              </p>
              {(calculation.results?.costs?.tco?.total5Years || calculation.results?.cost?.totalProjectCost) && (
                <p className="text-sm">
                  <span className="font-medium">Total Cost:</span> $
                  {calculation.results?.costs?.tco?.total5Years 
                    ? (calculation.results.costs.tco.total5Years / 1000000).toFixed(2) + 'M'
                    : (calculation.results?.cost?.totalProjectCost || 0).toLocaleString()}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Created: {calculation.createdAt 
                ? new Date(calculation.createdAt instanceof Date 
                    ? calculation.createdAt 
                    : (calculation.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleString() 
                : 'Unknown'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditCalculation(calculation.id)}
            >
              <Edit className="mr-2 h-4 w-4" />
              View
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}