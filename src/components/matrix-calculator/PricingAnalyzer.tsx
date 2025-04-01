import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Database, RefreshCw, AlertTriangle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { getFirestoreSafely } from "@/lib/firebase";
import { DEFAULT_PRICING } from "@/constants/calculatorConstants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingMatrix } from "@/types/pricingMatrix";

export function PricingAnalyzer() {
  const [isOpen, setIsOpen] = useState(false);
  const [pricingData, setPricingData] = useState<PricingMatrix | null>(null);
  const [defaultPricing, setDefaultPricing] = useState<PricingMatrix>(DEFAULT_PRICING as unknown as PricingMatrix);
  const [loading, setLoading] = useState(false);
  const [differences, setDifferences] = useState<any[]>([]);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  const fetchPricingData = useCallback(async () => {
    setLoading(true);
    try {
      const db = getFirestoreSafely();
      if (!db) {
        console.error("Firebase is not initialized");
        return;
      }

      // Fetch pricing matrix
      const pricingDocRef = doc(db, "matrix_calculator", "pricing_matrix");
      const pricingDoc = await getDoc(pricingDocRef);

      if (pricingDoc.exists()) {
        const data = pricingDoc.data() as PricingMatrix;
        setPricingData(data);
        
        // Compare with default pricing
        const diffs: any[] = [];
        const missing: string[] = [];
        
        // Check for missing top-level categories
        Object.keys(DEFAULT_PRICING).forEach(category => {
          const categoryKey = category as keyof typeof DEFAULT_PRICING;
          if (!data[categoryKey as keyof PricingMatrix]) {
            missing.push(category);
          } else {
            // Check for differences in values
            const defaultCategory = (DEFAULT_PRICING as any)[categoryKey];
            const dataCategory = (data as any)[categoryKey];
            
            if (defaultCategory && dataCategory) {
              // Use type assertion to handle string indexing
              const defaultCategoryObj = defaultCategory as Record<string, number>;
              const dataCategoryObj = dataCategory as Record<string, number>;
              
              Object.keys(defaultCategoryObj).forEach(key => {
                if (dataCategoryObj[key] !== defaultCategoryObj[key]) {
                  diffs.push({
                    category,
                    key,
                    defaultValue: defaultCategoryObj[key],
                    actualValue: dataCategoryObj[key]
                  });
                }
                
                // Check for missing keys
                if (dataCategoryObj[key] === undefined) {
                  missing.push(`${category}.${key}`);
                }
              });
            }
          }
        });
        
        setDifferences(diffs);
        setMissingKeys(missing);
      } else {
        setPricingData(null);
        setDifferences([]);
        setMissingKeys(Object.keys(DEFAULT_PRICING));
      }
    } catch (error) {
      console.error("Error fetching pricing data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPricingData();
    }
  }, [isOpen, fetchPricingData]);

  const formatData = (data: any) => {
    if (!data) return "No data";
    return JSON.stringify(data, null, 2);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full">
          {isOpen ? "Hide Pricing Analyzer" : "Show Pricing Analyzer"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <span>Pricing Data Analyzer</span>
              </div>
              <Button
                onClick={fetchPricingData}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </CardTitle>
            <CardDescription>
              Analyze pricing data to identify issues with calculation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="differences">Differences</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                <div className="space-y-4">
                  {pricingData ? (
                    <>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700 font-medium">Pricing data found in Firebase</p>
                        <p className="text-sm text-green-600">
                          {Object.keys(pricingData).length} categories available
                        </p>
                      </div>
                      
                      {missingKeys.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Missing Pricing Data</AlertTitle>
                          <AlertDescription>
                            {missingKeys.length} pricing keys are missing from the database.
                            This may cause calculations to use fallback values.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {differences.length > 0 && (
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <AlertTitle>Pricing Differences</AlertTitle>
                          <AlertDescription>
                            {differences.length} pricing values differ from defaults.
                            This is normal if you've customized pricing.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-gray-50 rounded-md">
                          <h3 className="font-medium mb-2">Key Categories</h3>
                          <ul className="text-sm space-y-1">
                            {Object.keys(pricingData).map((category) => (
                              <li key={category} className="flex justify-between">
                                <span>{category}</span>
                                <span className="text-gray-500">
                                  {Object.keys(pricingData[category] || {}).length} items
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-md">
                          <h3 className="font-medium mb-2">Critical Pricing Items</h3>
                          <ul className="text-sm space-y-1">
                            <li className="flex justify-between">
                              <span>busbar800A</span>
                              <span className="text-gray-500">
                                {pricingData?.busbar?.busbar800A || "Missing"}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span>standard63A (tapOffBox)</span>
                              <span className="text-gray-500">
                                {pricingData?.tapOffBox?.standard63A || "Missing"}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span>standard16A (rpdu)</span>
                              <span className="text-gray-500">
                                {pricingData?.rpdu?.standard16A || "Missing"}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span>frame2Module (ups)</span>
                              <span className="text-gray-500">
                                {pricingData?.ups?.frame2Module || "Missing"}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Pricing Data Not Found</AlertTitle>
                      <AlertDescription>
                        No pricing data found in Firebase. The calculator will use default values.
                        Try resetting to defaults using the Pricing Debugger.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="differences">
                <div className="space-y-4">
                  {differences.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-left">Key</th>
                            <th className="px-4 py-2 text-left">Default Value</th>
                            <th className="px-4 py-2 text-left">Actual Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {differences.map((diff, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">{diff.category}</td>
                              <td className="px-4 py-2">{diff.key}</td>
                              <td className="px-4 py-2">{diff.defaultValue}</td>
                              <td className="px-4 py-2">{diff.actualValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      No differences found between actual and default pricing.
                    </p>
                  )}
                  
                  {missingKeys.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Missing Keys</h3>
                      <div className="bg-red-50 p-4 rounded-md border border-red-200">
                        <ul className="text-sm space-y-1">
                          {missingKeys.map((key) => (
                            <li key={key} className="text-red-700">{key}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="raw">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Actual Pricing Data</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                      {formatData(pricingData)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Default Pricing Data</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                      {formatData(defaultPricing)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">
              Note: The calculator will fall back to default values for any missing pricing data.
              This may result in different calculations than expected.
            </p>
          </CardFooter>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}