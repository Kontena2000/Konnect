
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, AlertCircle, CheckCircle, Bug, RefreshCw } from "lucide-react";
import { calculatorDebug } from "@/services/calculatorDebug";
import { getFirestoreOrThrow } from "@/services/firebaseHelpers";
import { getPricingAndParams } from "@/services/matrixCalculatorService";
import { DEFAULT_CALCULATION_PARAMS, DEFAULT_PRICING } from "@/constants/calculatorConstants";

export function CalculatorDebugger() {
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [firebaseStatus, setFirebaseStatus] = useState<"loading" | "connected" | "error">("loading");
  const [pricingStatus, setPricingStatus] = useState<"loading" | "success" | "error">("loading");
  const [paramsStatus, setParamsStatus] = useState<"loading" | "success" | "error">("loading");
  const [pricingData, setPricingData] = useState<any>(null);
  const [paramsData, setParamsData] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Subscribe to debug logs
    const unsubscribe = calculatorDebug.subscribe((logs) => {
      setDebugLogs(logs);
    });

    // Check Firebase connection
    checkFirebaseConnection();
    
    // Check pricing and params
    checkPricingAndParams();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkFirebaseConnection = async () => {
    try {
      const db = getFirestoreOrThrow();
      if (db) {
        setFirebaseStatus("connected");
      } else {
        setFirebaseStatus("error");
      }
    } catch (error) {
      console.error("Firebase connection check failed:", error);
      setFirebaseStatus("error");
    }
  };

  const checkPricingAndParams = async () => {
    try {
      const { pricing, params } = await getPricingAndParams();
      
      setPricingData(pricing);
      setParamsData(params);
      
      // Check if pricing data is valid
      if (pricing && Object.keys(pricing).length > 0) {
        setPricingStatus("success");
      } else {
        setPricingStatus("error");
      }
      
      // Check if params data is valid
      if (params && Object.keys(params).length > 0) {
        setParamsStatus("success");
      } else {
        setParamsStatus("error");
      }
    } catch (error) {
      console.error("Error checking pricing and params:", error);
      setPricingStatus("error");
      setParamsStatus("error");
    }
  };

  const runTestCalculation = async () => {
    setIsRunningTest(true);
    setTestResults(null);
    
    try {
      // Import dynamically to avoid circular dependencies
      const { calculateConfiguration } = await import("@/services/matrixCalculatorService");
      
      // Run a simple test calculation
      const results = await calculateConfiguration(10, "air", 20, {
        redundancyMode: "N+1",
        includeGenerator: false,
        batteryRuntime: 10,
        sustainabilityOptions: {
          enableWasteHeatRecovery: false,
          enableWaterRecycling: false,
          renewableEnergyPercentage: 20
        }
      });
      
      setTestResults({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Test calculation failed:", error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const refreshStatus = () => {
    setFirebaseStatus("loading");
    setPricingStatus("loading");
    setParamsStatus("loading");
    checkFirebaseConnection();
    checkPricingAndParams();
  };

  const clearLogs = () => {
    calculatorDebug.clear();
  };

  const getStatusBadge = (status: "loading" | "connected" | "success" | "error") => {
    switch (status) {
      case "loading":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Loading</Badge>;
      case "connected":
      case "success":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Success</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Error</Badge>;
    }
  };

  const getErrorLogs = () => {
    return debugLogs.filter(log => log.level === "error");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Matrix Calculator Debugger
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refreshStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">
              Debug Logs
              {getErrorLogs().length > 0 && (
                <Badge variant="destructive" className="ml-2">{getErrorLogs().length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Firebase Connection</h3>
                    {getStatusBadge(firebaseStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {firebaseStatus === "connected" 
                      ? "Firebase is properly connected and available." 
                      : "Firebase connection issue detected. Check your configuration."}
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Pricing Matrix</h3>
                    {getStatusBadge(pricingStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pricingStatus === "success" 
                      ? "Pricing matrix loaded successfully." 
                      : "Using default pricing. Check Firestore."}
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Calculation Parameters</h3>
                    {getStatusBadge(paramsStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {paramsStatus === "success" 
                      ? "Calculation parameters loaded successfully." 
                      : "Using default parameters. Check Firestore."}
                  </p>
                </div>
              </div>
              
              {getErrorLogs().length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errors Detected</AlertTitle>
                  <AlertDescription>
                    {getErrorLogs().length} error(s) found in the debug logs. Check the Logs tab for details.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={runTestCalculation}>
                  Run Test Calculation
                </Button>
                <Button variant="outline" onClick={clearLogs}>
                  Clear Logs
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Debug Logs ({debugLogs.length})</h3>
                <Button variant="outline" size="sm" onClick={clearLogs}>
                  Clear Logs
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                  {debugLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No logs available</p>
                  ) : (
                    debugLogs.map((log, index) => (
                      <Collapsible key={index} className="border rounded-md overflow-hidden">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left">
                          <div className="flex items-center gap-2">
                            {log.level === "error" ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : log.level === "warn" ? (
                              <Info className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium">{log.source}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <Badge variant={log.level === "error" ? "destructive" : log.level === "warn" ? "outline" : "secondary"}>
                            {log.level}
                          </Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 pt-0 border-t">
                            <p className="mb-2">{log.message}</p>
                            {log.data && (
                              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                {typeof log.data === "object" ? JSON.stringify(log.data, null, 2) : log.data}
                              </pre>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Pricing Matrix</h3>
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    {pricingData ? (
                      <pre className="text-xs">
                        {JSON.stringify(pricingData, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No pricing data available</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Calculation Parameters</h3>
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    {paramsData ? (
                      <pre className="text-xs">
                        {JSON.stringify(paramsData, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No parameters data available</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Default Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <h4 className="text-sm font-medium mb-2">Default Pricing</h4>
                    <pre className="text-xs">
                      {JSON.stringify(DEFAULT_PRICING, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <h4 className="text-sm font-medium mb-2">Default Parameters</h4>
                    <pre className="text-xs">
                      {JSON.stringify(DEFAULT_CALCULATION_PARAMS, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Test Calculation</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runTestCalculation}
                  disabled={isRunningTest}
                >
                  {isRunningTest ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    "Run Test"
                  )}
                </Button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Test Configuration</h4>
                <pre className="text-xs bg-muted p-2 rounded">
                  {JSON.stringify({
                    kwPerRack: 10,
                    coolingType: "air",
                    totalRacks: 20,
                    options: {
                      redundancyMode: "N+1",
                      includeGenerator: false,
                      batteryRuntime: 10,
                      sustainabilityOptions: {
                        enableWasteHeatRecovery: false,
                        enableWaterRecycling: false,
                        renewableEnergyPercentage: 20
                      }
                    }
                  }, null, 2)}
                </pre>
              </div>
              
              {testResults && (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Test Results</h4>
                    <Badge variant={testResults.success ? "outline" : "destructive"}>
                      {testResults.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  
                  {testResults.success ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      <pre className="text-xs bg-muted p-2 rounded">
                        {JSON.stringify(testResults.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Calculation Failed</AlertTitle>
                      <AlertDescription>
                        {testResults.error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Test ran at: {new Date(testResults.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
