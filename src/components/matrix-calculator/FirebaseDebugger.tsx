
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, AlertTriangle, Bug, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getFirestoreSafely, isFirebaseInitialized } from '@/lib/firebase';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { waitForMatrixCalculatorBootstrap } from '@/utils/matrixCalculatorBootstrap';

export function FirebaseDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'initializing' | 'initialized' | 'error'>('initializing');
  const [collections, setCollections] = useState<{ [key: string]: any[] }>({});
  const [matrixCalculatorStatus, setMatrixCalculatorStatus] = useState<'initializing' | 'initialized' | 'error'>('initializing');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [defaultsUsed, setDefaultsUsed] = useState(false);

  // Check Firebase status on mount
  useEffect(() => {
    checkFirebaseStatus();
    checkMatrixCalculatorStatus();
  }, []);

  const checkFirebaseStatus = () => {
    try {
      const initialized = isFirebaseInitialized();
      setFirebaseStatus(initialized ? 'initialized' : 'error');
      
      if (initialized) {
        fetchCollections();
      }
    } catch (error) {
      console.error('Error checking Firebase status:', error);
      setFirebaseStatus('error');
    }
  };

  const checkMatrixCalculatorStatus = async () => {
    try {
      setMatrixCalculatorStatus('initializing');
      const bootstrapped = await waitForMatrixCalculatorBootstrap();
      setMatrixCalculatorStatus(bootstrapped ? 'initialized' : 'error');
    } catch (error) {
      console.error('Error checking Matrix Calculator status:', error);
      setMatrixCalculatorStatus('error');
    }
  };

  const fetchCollections = async () => {
    const db = getFirestoreSafely();
    if (!db) return;

    try {
      // Fetch collections
      const collectionsToCheck = [
        'matrix_calculator',
        'projects',
        'users',
        'modules',
        'layouts'
      ];

      const collectionData: { [key: string]: any[] } = {};

      for (const collectionName of collectionsToCheck) {
        try {
          // For matrix_calculator, check if the document exists
          if (collectionName === 'matrix_calculator') {
            // Check if the pricing_matrix document exists
            const pricingMatrixRef = doc(db, 'matrix_calculator', 'pricing_matrix');
            try {
              const pricingDoc = await getDoc(pricingMatrixRef);
              collectionData['matrix_calculator_pricing'] = [{ 
                exists: pricingDoc.exists(),
                id: 'pricing_matrix'
              }];
            } catch (error) {
              collectionData['matrix_calculator_pricing'] = [{ exists: false, error: String(error) }];
            }

            // Check if the calculation_params document exists
            const paramsRef = doc(db, 'matrix_calculator', 'calculation_params');
            try {
              const paramsDoc = await getDoc(paramsRef);
              collectionData['matrix_calculator_params'] = [{ 
                exists: paramsDoc.exists(),
                id: 'calculation_params'
              }];
            } catch (error) {
              collectionData['matrix_calculator_params'] = [{ exists: false, error: String(error) }];
            }

            // Check if the user_configurations document exists
            const configsRef = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
            try {
              const configsSnapshot = await getDocs(query(configsRef, limit(5)));
              collectionData['matrix_calculator_configs'] = configsSnapshot.docs.map(doc => ({
                id: doc.id,
                exists: true
              }));
              
              if (configsSnapshot.empty) {
                collectionData['matrix_calculator_configs'] = [{ exists: false, message: 'No configurations found' }];
              }
            } catch (error) {
              collectionData['matrix_calculator_configs'] = [{ exists: false, error: String(error) }];
            }
          } else {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(query(collectionRef, limit(5)));
            
            collectionData[collectionName] = snapshot.docs.map(doc => ({
              id: doc.id,
              exists: true
            }));
            
            if (snapshot.empty) {
              collectionData[collectionName] = [{ exists: false, message: 'No documents found' }];
            }
          }
        } catch (error) {
          console.error(`Error fetching collection ${collectionName}:`, error);
          collectionData[collectionName] = [{ error: String(error) }];
        }
      }

      setCollections(collectionData);
      
      // Check if we're using default values
      const hasMatrixCalculator = collectionData['matrix_calculator_pricing']?.[0]?.exists &&
                                 collectionData['matrix_calculator_params']?.[0]?.exists;
      setDefaultsUsed(!hasMatrixCalculator);
      
      // Add some logs
      const newLogs = [];
      newLogs.push(`[${new Date().toISOString()}] INFO: Firebase status check completed`);
      if (hasMatrixCalculator) {
        newLogs.push(`[${new Date().toISOString()}] INFO: Matrix Calculator collections found`);
      } else {
        newLogs.push(`[${new Date().toISOString()}] WARNING: Matrix Calculator collections not found, using defaults`);
      }
      
      // Check for configs
      const hasConfigs = collectionData['matrix_calculator_configs']?.[0]?.exists;
      if (hasConfigs) {
        newLogs.push(`[${new Date().toISOString()}] INFO: User configurations found`);
      } else {
        newLogs.push(`[${new Date().toISOString()}] INFO: No user configurations found yet`);
      }
      
      setLogs(newLogs);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setLogs([`[${new Date().toISOString()}] ERROR: Failed to fetch collections: ${error}`]);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      checkFirebaseStatus();
      await checkMatrixCalculatorStatus();
      
      // Force bootstrap the Matrix Calculator
      const bootstrapped = await waitForMatrixCalculatorBootstrap();
      console.log('Matrix Calculator bootstrap result:', bootstrapped);
      
      // Add log
      setLogs(prev => [
        ...prev,
        `[${new Date().toISOString()}] INFO: Diagnostics run completed`,
        `[${new Date().toISOString()}] INFO: Matrix Calculator bootstrap result: ${bootstrapped ? 'success' : 'failed'}`
      ]);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setLogs(prev => [
        ...prev,
        `[${new Date().toISOString()}] ERROR: Diagnostics failed: ${error}`
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full">
          {isOpen ? "Hide Firebase Debugger" : "Show Firebase Debugger"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Firebase Status</span>
              <Button onClick={runDiagnostics} size="sm" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Run Diagnostics
              </Button>
            </CardTitle>
            <CardDescription>
              Check the status of Firebase and Matrix Calculator collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${firebaseStatus === 'initialized' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Firebase is {firebaseStatus === 'initialized' ? 'properly initialized' : 'not initialized'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${matrixCalculatorStatus === 'initialized' ? 'bg-green-500' : matrixCalculatorStatus === 'initializing' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span>Matrix Calculator is {matrixCalculatorStatus === 'initialized' ? 'properly initialized' : matrixCalculatorStatus === 'initializing' ? 'initializing' : 'not initialized'}</span>
              </div>
              
              {defaultsUsed && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Using Default Values</AlertTitle>
                  <AlertDescription>
                    Matrix Calculator collections not found in Firebase. Using default values for calculations.
                    Calculations will still work, but custom pricing and parameters are not available.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Collections</h3>
                <div className="space-y-4">
                  {Object.entries(collections).map(([collectionName, docs]) => (
                    <div key={collectionName} className="border p-3 rounded-md">
                      <h4 className="font-medium">{collectionName}</h4>
                      <p className="text-sm text-muted-foreground">{docs.length} documents</p>
                      
                      {docs.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium">Sample IDs:</h5>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {docs.map((doc, index) => (
                              <div key={index} className="truncate">
                                {doc.id || (doc.error ? `Error: ${doc.error}` : 'No ID')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Debug Logs</h3>
                <div className="bg-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
                  {logs.length > 0 ? (
                    <pre className="text-xs whitespace-pre-wrap">
                      {logs.join('\n')}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">No logs available</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setLogs([])} 
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              Clear Logs
            </Button>
          </CardFooter>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
