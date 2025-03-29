import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface SavedCalculationsProps {
  userId: string;
  onLoadCalculation?: (calculation: any) => void;
}

export function SavedCalculations({ userId, onLoadCalculation }: SavedCalculationsProps) {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    loadCalculations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  const loadCalculations = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const calculationsRef = collection(db, 'users', userId, 'calculations');
      
      const q = query(
        calculationsRef,
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const loadedCalculations: any[] = [];
      
      snapshot.forEach(doc => {
        loadedCalculations.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });
      
      setCalculations(loadedCalculations);
    } catch (error) {
      console.error('Error loading calculations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;
    
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'users', userId, 'calculations', id));
      
      // Update local state
      setCalculations(prev => prev.filter(calc => calc.id !== id));
    } catch (error) {
      console.error('Error deleting calculation:', error);
      alert('Failed to delete calculation');
    }
  };
  
  const handleLoad = (calculation: any) => {
    if (onLoadCalculation) {
      onLoadCalculation(calculation.results);
    }
  };
  
  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Saved Calculations
          </div>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CardTitle>
      </CardHeader>
      
      {expanded && (
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calculations.length > 0 ? (
            <div className="space-y-4">
              {calculations.map(calculation => (
                <div key={calculation.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{calculation.name || 'Unnamed Configuration'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(calculation.timestamp)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleLoad(calculation)}
                      >
                        Load
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(calculation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Power Density:</span>
                      <span className="ml-2 font-medium">{calculation.results.rack.powerDensity} kW/rack</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cooling:</span>
                      <span className="ml-2 font-medium">
                        {calculation.results.rack.coolingType === 'dlc' ? 'Direct Liquid' : 'Air-cooled'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="ml-2 font-medium">
                        ${calculation.results.cost.totalProjectCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No saved calculations yet.</p>
              <p className="text-sm mt-1">Configure the calculator and save your results to see them here.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}