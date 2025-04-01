import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, RefreshCw } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestoreSafely } from '@/lib/firebase';
import { resetMatrixCalculator } from '@/services/matrixCalculatorInitializer';
import { useToast } from '@/hooks/use-toast';

export function PricingDebugger() {
  const [pricingData, setPricingData] = useState<any>(null);
  const [paramsData, setParamsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  const fetchPricingData = useCallback(async () => {
    setLoading(true);
    try {
      const db = getFirestoreSafely();
      if (!db) {
        toast({
          title: 'Error',
          description: 'Firebase is not initialized',
          variant: 'destructive'
        });
        return;
      }

      // Fetch pricing matrix
      const pricingDocRef = doc(db, 'matrix_calculator', 'pricing_matrix');
      const pricingDoc = await getDoc(pricingDocRef);
      
      if (pricingDoc.exists()) {
        setPricingData(pricingDoc.data());
      } else {
        setPricingData({ error: 'Pricing matrix not found' });
      }

      // Fetch calculation parameters
      const paramsDocRef = doc(db, 'matrix_calculator', 'calculation_params');
      const paramsDoc = await getDoc(paramsDocRef);
      
      if (paramsDoc.exists()) {
        setParamsData(paramsDoc.data());
      } else {
        setParamsData({ error: 'Calculation parameters not found' });
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pricing data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleReset = async () => {
    setResetting(true);
    try {
      const success = await resetMatrixCalculator();
      if (success) {
        toast({
          title: 'Success',
          description: 'Matrix Calculator has been reset successfully'
        });
        // Refetch data after reset
        fetchPricingData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to reset Matrix Calculator',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error resetting Matrix Calculator:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while resetting Matrix Calculator',
        variant: 'destructive'
      });
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, [fetchPricingData]);

  const formatData = (data: any) => {
    if (!data) return 'No data';
    if (data.error) return data.error;
    return JSON.stringify(data, null, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Pricing Data Debugger</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPricingData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reset to Defaults'
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="pricing">
            <AccordionTrigger>Pricing Matrix</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {formatData(pricingData)}
              </pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="params">
            <AccordionTrigger>Calculation Parameters</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {formatData(paramsData)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}