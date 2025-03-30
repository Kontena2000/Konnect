
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Bug, RefreshCw } from "lucide-react";
import { calculatorDebug, checkFirebaseInitialization } from "@/services/calculatorDebug";
import { db } from "@/lib/firebase";
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from "@/constants/calculatorConstants";

export function FirebaseDebugger() {
  const [loading, setLoading] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<{success: boolean; message: string}>({ 
    success: false, 
    message: "Not checked yet" 
  });
  const [firestoreStatus, setFirestoreStatus] = useState<{success: boolean; message: string}>({ 
    success: false, 
    message: "Not checked yet" 
  });
  const [calculationSteps, setCalculationSteps] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [defaultsUsed, setDefaultsUsed] = useState(false);

  useEffect(() => {
    // Check Firebase initialization on component mount
    checkFirebaseInitializationStatus();
    
    // Check Firestore access
    checkFirestoreAccess();
    
    // Get calculation steps from debug utility
    setCalculationSteps(calculatorDebug.calculationSteps);
  }, []);

  const checkFirebaseInitializationStatus = () => {
    try {
      const isInitialized = checkFirebaseInitialization();
      setFirebaseStatus({
        success: isInitialized,
        message: isInitialized 
          ? "Firebase is properly initialized" 
          : "Firebase initialization failed - using default values"
      });
      
      if (!isInitialized) {
        setDefaultsUsed(true);
      }
    } catch (error) {
      setFirebaseStatus({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      setDefaultsUsed(true);
    }
  };

  const checkFirestoreAccess = async () => {
    try {
      if (!db) {
        setFirestoreStatus({
          success: false,
          message: "Firestore is not initialized - using default values"
        });
        setDefaultsUsed(true);
        return;
      }
      
      // Try to access Firestore
      try {
        const { collection, getDocs, query, limit } = require('firebase/firestore');
        const testQuery = query(collection(db, 'matrix_calculator'), limit(1));
        await getDocs(testQuery);
        setFirestoreStatus({
          success: true,
          message: "Firestore is accessible"
        });
      } catch (error) {
        setFirestoreStatus({
          success: false,
          message: `Firestore access failed: ${error instanceof Error ? error.message : String(error)} - using default values`
        });
        setDefaultsUsed(true);
      }
    } catch (error) {
      setFirestoreStatus({
        success: false,
        message: `Error checking Firestore: ${error instanceof Error ? error.message : String(error)}`
      });
      setDefaultsUsed(true);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    
    try {
      // Check Firebase initialization
      checkFirebaseInitializationStatus();
      
      // Check Firestore access
      await checkFirestoreAccess();
      
      // Update calculation steps
      setCalculationSteps(calculatorDebug.calculationSteps);
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearDebugLogs = () => {
    calculatorDebug.calculationSteps = [];
    setCalculationSteps([]);
  };

  const toggleDebugMode = () => {
    calculatorDebug.enabled = !calculatorDebug.enabled;
    calculatorDebug.verbose = calculatorDebug.enabled;
    alert(`Debug mode ${calculatorDebug.enabled ? 'enabled' : 'disabled'}`);
  };

  return (
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
            <Alert className={firebaseStatus.success ? "bg-green-50" : "bg-amber-50"}>
              <AlertTitle className="flex items-center gap-2">
                {firebaseStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Firebase Status
              </AlertTitle>
              <AlertDescription>
                {firebaseStatus.message}
              </AlertDescription>
            </Alert>
            
            {/* Firestore Status */}
            <Alert className={firestoreStatus.success ? "bg-green-50" : "bg-amber-50"}>
              <AlertTitle className="flex items-center gap-2">
                {firestoreStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Firestore Status
              </AlertTitle>
              <AlertDescription>
                {firestoreStatus.message}
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
                  Calculation Steps ({calculationSteps.length})
                </AccordionTrigger>
                <AccordionContent>
                  {calculationSteps.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No calculation steps recorded</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto text-sm">
                      {calculationSteps.map((step, index) => (
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
  );
}
