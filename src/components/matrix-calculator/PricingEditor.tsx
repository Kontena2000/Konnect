
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { DEFAULT_PRICING } from '@/constants/calculatorConstants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getFirestoreSafely, ensureFirebaseInitializedAsync } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface PricingEditorProps {
  readOnly?: boolean;
  onSave?: (pricing: any) => void;
}

export function PricingEditor({ readOnly = false, onSave }: PricingEditorProps) {
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('electrical');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, role } = useAuth();
  
  // Available categories
  const categories = [
    { id: 'electrical', label: 'Electrical', subcategories: ['busbar', 'tapOffBox', 'rpdu'] },
    { id: 'cooling', label: 'Cooling', subcategories: ['rdhx', 'piping', 'cooler'] },
    { id: 'power', label: 'Power Systems', subcategories: ['ups', 'battery'] },
    { id: 'infrastructure', label: 'Infrastructure', subcategories: ['eHouse'] }
  ];
  
  // Load pricing data
  useEffect(() => {
    async function loadPricing() {
      try {
        setLoading(true);
        setErrorDetails(null);
        
        console.log('[PricingEditor] Starting to load pricing data');
        
        const initialized = await ensureFirebaseInitializedAsync();
        console.log('[PricingEditor] Firebase initialized:', initialized);
        
        const db = getFirestoreSafely();
        
        if (!db) {
          const errorMsg = 'Firestore is not available';
          console.error('[PricingEditor]', errorMsg);
          setErrorDetails(errorMsg);
          toast({
            title: 'Error',
            description: 'Could not connect to database',
            variant: 'destructive'
          });
          return;
        }
        
        console.log('[PricingEditor] Attempting to fetch pricing matrix document');
        
        try {
          const pricingDocRef = doc(db, 'matrix_calculator', 'pricing_matrix');
          console.log('[PricingEditor] Document reference created:', pricingDocRef.path);
          
          const pricingDoc = await getDoc(pricingDocRef);
          console.log('[PricingEditor] Document fetch result:', pricingDoc.exists() ? 'Document exists' : 'Document does not exist');
          
          if (pricingDoc.exists()) {
            const data = pricingDoc.data();
            console.log('[PricingEditor] Document data retrieved successfully');
            setPricing(data);
          } else {
            console.log('[PricingEditor] Document does not exist, using default pricing');
            setPricing(DEFAULT_PRICING);
          }
        } catch (docError: any) {
          const errorMsg = `Error fetching pricing document: ${docError.message || 'Unknown error'}`;
          console.error('[PricingEditor]', errorMsg);
          setErrorDetails(errorMsg);
          throw docError;
        }
      } catch (error: any) {
        const errorMsg = `Error loading pricing data: ${error.message || 'Unknown error'}`;
        console.error('[PricingEditor]', errorMsg);
        setErrorDetails(errorMsg);
        toast({
          title: 'Error',
          description: 'Failed to load pricing data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadPricing();
  }, [toast]);
  
  // Handle price change
  const handlePriceChange = (subcategory: string, field: string, value: string) => {
    if (readOnly) return;
    
    setPricing((prev: any) => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [field]: parseFloat(value)
      }
    }));
  };
  
  // Save pricing data
  const savePricing = async () => {
    if (readOnly) return;
    
    try {
      setSaving(true);
      setErrorDetails(null);
      
      console.log('[PricingEditor] Starting to save pricing data');
      console.log('[PricingEditor] User:', user?.email, 'Role:', role);
      
      const initialized = await ensureFirebaseInitializedAsync();
      console.log('[PricingEditor] Firebase initialized:', initialized);
      
      const db = getFirestoreSafely();
      
      if (!db) {
        const errorMsg = 'Firestore is not available';
        console.error('[PricingEditor]', errorMsg);
        setErrorDetails(errorMsg);
        toast({
          title: 'Error',
          description: 'Could not connect to database',
          variant: 'destructive'
        });
        return;
      }
      
      if (!pricing || typeof pricing !== 'object') {
        const errorMsg = 'Invalid pricing data structure';
        console.error('[PricingEditor]', errorMsg, pricing);
        setErrorDetails(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive'
        });
        return;
      }
      
      console.log('[PricingEditor] Pricing data to save:', JSON.stringify(pricing));
      
      try {
        const pricingDocRef: DocumentReference = doc(db, 'matrix_calculator', 'pricing_matrix');
        console.log('[PricingEditor] Document reference created:', pricingDocRef.path);
        
        // Save to main pricing document
        await setDoc(pricingDocRef, pricing);
        console.log('[PricingEditor] Pricing data saved successfully');
        
        // Add to version history
        try {
          const historyCollectionRef = collection(db, 'matrix_calculator', 'version_history');
          await addDoc(historyCollectionRef, {
            type: 'pricing_update',
            pricing: pricing,
            timestamp: serverTimestamp(),
            updatedBy: user?.email || 'unknown'
          });
          console.log('[PricingEditor] Version history updated successfully');
        } catch (historyError: any) {
          console.warn('[PricingEditor] Failed to update version history:', historyError.message);
        }
        
        if (onSave) {
          onSave(pricing);
        }
        
        toast({
          title: 'Success',
          description: 'Pricing saved successfully',
          variant: 'default'
        });
      } catch (saveError: any) {
        const errorMsg = `Error saving pricing document: ${saveError.message || 'Unknown error'}`;
        console.error('[PricingEditor]', errorMsg);
        setErrorDetails(errorMsg);
        throw saveError;
      }
    } catch (error: any) {
      const errorMsg = `Failed to save pricing data: ${error.message || 'Unknown error'}`;
      console.error('[PricingEditor] Error saving pricing:', error);
      setErrorDetails(errorMsg);
      
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading pricing data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!pricing) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>
              No pricing data available. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Component Pricing Configuration</CardTitle>
        <CardDescription>
          Configure pricing for different components used in the matrix calculator
        </CardDescription>
      </CardHeader>
      <CardContent>
        {readOnly && (
          <Alert className="mb-6">
            <AlertDescription>
              You are in view-only mode. Contact an administrator to make changes.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              {category.subcategories.map(subcategory => (
                <div key={subcategory} className="space-y-4">
                  <h3 className="text-lg font-medium capitalize">
                    {subcategory.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(pricing[subcategory] || {}).map(([field, value]) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`${subcategory}-${field}`} className="text-sm">
                          {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id={`${subcategory}-${field}`}
                            type="number"
                            value={value as number}
                            onChange={(e) => handlePriceChange(subcategory, field, e.target.value)}
                            disabled={readOnly}
                            min="0"
                            step="100"
                            className="pl-7"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setPricing(DEFAULT_PRICING)}
            disabled={readOnly || saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={savePricing}
            disabled={readOnly || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Pricing Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
