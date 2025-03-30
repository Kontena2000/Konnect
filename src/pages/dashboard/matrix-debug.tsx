import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Info, Bug } from "lucide-react";
import { checkFirebaseInitialization } from "@/utils/firebaseDebug";
import matrixDebugService, { MatrixDebugInfo } from "@/services/matrixDebugService";
import { AppLayout } from "@/components/layout/AppLayout";
import { FirebaseDebugger } from "@/components/matrix-calculator/FirebaseDebugger";
import { initializeFirebaseSafely } from "@/services/firebase-init";

export default function MatrixDebugPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<MatrixDebugInfo | null>(null);
  const [calculationId, setCalculationId] = useState("");
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
    
    // Check Firebase initialization on component mount
    try {
      // First try to initialize Firebase safely
      initializeFirebaseSafely();
      
      // Then check if it's initialized
      const isInitialized = checkFirebaseInitialization();
      setFirebaseInitialized(isInitialized);
    } catch (error) {
      console.error("Error checking Firebase initialization:", error);
      setFirebaseInitialized(false);
    }
  }, [user, loading, router]);

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const result = await matrixDebugService.runDiagnostic();
      setDiagnosticResult(result);
    } catch (error) {
      console.error("Error running diagnostic:", error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const testCalculation = async () => {
    if (!calculationId) return;
    
    setCalculationLoading(true);
    try {
      const result = await matrixDebugService.testCalculation(calculationId);
      setCalculationResult(result);
    } catch (error) {
      console.error("Error testing calculation:", error);
      setCalculationResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setCalculationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Matrix Calculator Diagnostics</h1>
        
        <div className="grid gap-6">
          {/* Firebase Initialization Status */}
          <Card>
            <CardHeader>
              <CardTitle>Firebase Initialization Status</CardTitle>
              <CardDescription>
                Check if Firebase is properly initialized
              </CardDescription>
            </CardHeader>
            <CardContent>
              {firebaseInitialized === null ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Checking Firebase initialization...</span>
                </div>
              ) : firebaseInitialized ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Firebase Initialized</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Firebase is properly initialized and ready to use.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Firebase Not Initialized</AlertTitle>
                  <AlertDescription>
                    Firebase is not properly initialized. Check your console for more details.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => {
                const isInitialized = checkFirebaseInitialization();
                setFirebaseInitialized(isInitialized);
              }}>
                Recheck Initialization
              </Button>
            </CardFooter>
          </Card>
          
          <Tabs defaultValue="diagnostic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="diagnostic">System Diagnostic</TabsTrigger>
              <TabsTrigger value="calculation">Test Calculation</TabsTrigger>
            </TabsList>
            
            {/* System Diagnostic */}
            <TabsContent value="diagnostic">
              <Card>
                <CardHeader>
                  <CardTitle>System Diagnostic</CardTitle>
                  <CardDescription>
                    Run a comprehensive diagnostic on the Matrix calculator's Firebase dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosticResult && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Firebase Status</h3>
                        {diagnosticResult.firebaseInitialized ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>Firebase is properly initialized</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-5 w-5 mr-2" />
                            <span>Firebase is not properly initialized</span>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Collections</h3>
                        {diagnosticResult.collections.length === 0 ? (
                          <p className="text-muted-foreground">No collections checked</p>
                        ) : (
                          <div className="space-y-3">
                            {diagnosticResult.collections.map((collection, index) => (
                              <div key={index} className="p-3 bg-muted rounded-md">
                                <div className="flex justify-between">
                                  <span className="font-medium">{collection.name}</span>
                                  <span>{collection.documentCount} documents</span>
                                </div>
                                {collection.sampleDocumentIds.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-sm text-muted-foreground">Sample IDs:</span>
                                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                      {collection.sampleDocumentIds.map((id, idx) => (
                                        <div key={idx} className="font-mono">{id}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {diagnosticResult.errors.length > 0 && (
                        <>
                          <Separator />
                          
                          <div>
                            <h3 className="text-lg font-medium mb-2 text-red-600">Errors</h3>
                            <div className="space-y-2">
                              {diagnosticResult.errors.map((error, index) => (
                                <Alert key={index} variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>{error}</AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={runDiagnostic} 
                    disabled={isRunningDiagnostic}
                  >
                    {isRunningDiagnostic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isRunningDiagnostic ? "Running Diagnostic..." : "Run Diagnostic"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Test Calculation */}
            <TabsContent value="calculation">
              <Card>
                <CardHeader>
                  <CardTitle>Test Calculation</CardTitle>
                  <CardDescription>
                    Test access to a specific calculation by ID
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="calculationId">Calculation ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="calculationId"
                          value={calculationId}
                          onChange={(e) => setCalculationId(e.target.value)}
                          placeholder="Enter calculation ID"
                        />
                        <Button 
                          onClick={testCalculation} 
                          disabled={!calculationId || calculationLoading}
                        >
                          {calculationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Test
                        </Button>
                      </div>
                    </div>
                    
                    {calculationResult && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Result</h3>
                        
                        {calculationResult.error ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{calculationResult.error}</AlertDescription>
                          </Alert>
                        ) : calculationResult.exists ? (
                          <div className="p-3 bg-muted rounded-md">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Calculation found</span>
                            </div>
                            <div className="overflow-auto max-h-60">
                              <pre className="text-xs font-mono">
                                {JSON.stringify(calculationResult.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Not Found</AlertTitle>
                            <AlertDescription>
                              No calculation found with the provided ID.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}