import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Bug, RefreshCw } from "lucide-react";
import { calculatorDebug, checkFirebaseInitialization } from "@/services/calculatorDebug";
import { db } from "@/lib/firebase";
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from "@/constants/calculatorConstants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getFirestoreSafely, isFirebaseInitialized } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
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
    getDebugLogs();
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

  const getDebugLogs = () => {
    const debugLogs = calculatorDebug.getLogs();
    setLogs(debugLogs.map(log => `[${log.timestamp}] ${log.type}: ${log.message}`));
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
            const pricingMatrixRef = collection(db, 'matrix_calculator', 'pricing_matrix', 'dummy');
            try {
              await getDocs(pricingMatrixRef);
              collectionData['matrix_calculator_pricing'] = [{ exists: true }];
            } catch (error) {
              collectionData['matrix_calculator_pricing'] = [{ exists: false, error: String(error) }];
            }

            // Check if the calculation_params document exists
            const paramsRef = collection(db, 'matrix_calculator', 'calculation_params', 'dummy');
            try {
              await getDocs(paramsRef);
              collectionData['matrix_calculator_params'] = [{ exists: true }];
            } catch (error) {
              collectionData['matrix_calculator_params'] = [{ exists: false, error: String(error) }];
            }

            // Check if the user_configurations document exists
            const configsRef = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
            try {
              const configsSnapshot = await getDocs(query(configsRef, limit(5)));
              collectionData['matrix_calculator_configs'] = configsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            } catch (error) {
              collectionData['matrix_calculator_configs'] = [{ exists: false, error: String(error) }];
            }
          } else {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(query(collectionRef, limit(5)));
            
            collectionData[collectionName] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        } catch (error) {
          console.error(`Error fetching collection ${collectionName}:`, error);
          collectionData[collectionName] = [{ error: String(error) }];
        }
      }

      setCollections(collectionData);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const runDiagnostics = async () => {
    checkFirebaseStatus();
    checkMatrixCalculatorStatus();
    getDebugLogs();
    
    // Force bootstrap the Matrix Calculator
    try {
      const bootstrapped = await waitForMatrixCalculatorBootstrap();
      console.log('Matrix Calculator bootstrap result:', bootstrapped);
      calculatorDebug.log('Matrix Calculator bootstrap result:', bootstrapped);
    } catch (error) {
      console.error('Error bootstrapping Matrix Calculator:', error);
      calculatorDebug.error('Error bootstrapping Matrix Calculator', error);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            {showDebugPanel ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
          
          {showDebugPanel && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleDebugMode}
                className="flex items-center gap-2"
              >
                {calculatorDebug.enabled ? "Disable Debug Mode" : "Enable Debug Mode"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearDebugLogs}
                className="flex items-center gap-2"
              >
                Clear Logs
              </Button>
            </div>
          )}
        </div>
        
        {defaultsUsed && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Using Default Values</AlertTitle>
            <AlertDescription>
              Due to Firebase connection issues, the calculator is using default values. 
              Calculations will still work, but custom pricing and parameters are not available.
            </AlertDescription>
          </Alert>
        )}
        
        {showDebugPanel && (
          <Card>
            <CardHeader>
              <CardTitle>Calculator Diagnostics</CardTitle>
              <CardDescription>
                Troubleshoot issues with the Matrix Calculator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Firebase Status */}
              <Alert className={firebaseStatus === 'initialized' ? "bg-green-50" : "bg-amber-50"}>
                <AlertTitle className="flex items-center gap-2">
                  {firebaseStatus === 'initialized' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  Firebase Status
                </AlertTitle>
                <AlertDescription>
                  {firebaseStatus === 'initialized' ? "Firebase is properly initialized" : "Firebase initialization failed - using default values"}
                </AlertDescription>
              </Alert>
              
              {/* Firestore Status */}
              <Alert className={matrixCalculatorStatus === 'initialized' ? "bg-green-50" : "bg-amber-50"}>
                <AlertTitle className="flex items-center gap-2">
                  {matrixCalculatorStatus === 'initialized' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  Firestore Status
                </AlertTitle>
                <AlertDescription>
                  {matrixCalculatorStatus === 'initialized' ? "Firestore is accessible" : "Firestore access failed - using default values"}
                </AlertDescription>
              </Alert>
              
              {/* Default Values Info */}
              <Alert className="bg-blue-50">
                <AlertTitle>Default Values</AlertTitle>
                <AlertDescription>
                  When Firebase is unavailable, the calculator uses built-in default values:
                  <ul className="list-disc pl-5 mt-2">
                    <li>Default pricing matrix with standard rates</li>
                    <li>Default calculation parameters for all calculations</li>
                    <li>Saving calculations will be disabled</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {/* Calculation Steps */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="calculation-steps">
                  <AccordionTrigger>
                    Calculation Steps ({logs.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No calculation steps recorded</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto text-sm">
                        {logs.map((step, index) => (
                          <div 
                            key={index} 
                            className={`py-1 px-2 ${
                              step.startsWith("ERROR:") 
                                ? "bg-red-50 text-red-700" 
                                : step.startsWith("WARNING:") 
                                  ? "bg-amber-50 text-amber-700" 
                                  : "border-b"
                            }`}
                          >
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={runDiagnostics} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Run Diagnostics
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </Collapsible>
  );
}