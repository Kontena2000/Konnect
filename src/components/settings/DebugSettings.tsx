import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Info, Bug, RefreshCw } from "lucide-react";
import { checkFirebaseInitialization } from "@/utils/firebaseDebug";
import { FirebaseDebugger } from "@/components/matrix-calculator/FirebaseDebugger";
import debugService, { DiagnosticResult } from "@/services/debugService";
import { LogLevel, ModuleTag } from "@/types/module-tags";

export function DebugSettings() {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [testId, setTestId] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [moduleFilters, setModuleFilters] = useState<ModuleTag[]>(["matrix", "layout", "firebase", "auth", "editor", "general"]);
  const [levelFilters, setLevelFilters] = useState<LogLevel[]>(["info", "log", "warn", "error", "debug"]);

  // Initialize and check Firebase on component mount
  useEffect(() => {
    checkFirebaseStatus();
    
    // Subscribe to debug service logs
    const unsubscribe = debugService.addListener((filteredLogs) => {
      setLogs(filteredLogs);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const checkFirebaseStatus = () => {
    try {
      const isInitialized = checkFirebaseInitialization();
      setFirebaseInitialized(isInitialized);
    } catch (error) {
      console.error("Error checking Firebase initialization:", error);
      setFirebaseInitialized(false);
    }
  };

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const result = await debugService.runDiagnostic();
      setDiagnosticResult(result);
    } catch (error) {
      console.error("Error running diagnostic:", error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const testCalculation = async () => {
    if (!testId) return;
    
    setTestLoading(true);
    try {
      const result = await debugService.testCalculation(testId);
      setTestResult(result);
    } catch (error) {
      console.error("Error testing calculation:", error);
      setTestResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setTestLoading(false);
    }
  };

  const testLayout = async () => {
    if (!testId) return;
    
    setTestLoading(true);
    try {
      const result = await debugService.testLayout(testId);
      setTestResult(result);
    } catch (error) {
      console.error("Error testing layout:", error);
      setTestResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setTestLoading(false);
    }
  };

  const clearLogs = () => {
    debugService.clearLogs();
  };

  const toggleModuleFilter = (module: ModuleTag) => {
    if (moduleFilters.includes(module)) {
      setModuleFilters(moduleFilters.filter(m => m !== module));
      debugService.setModuleFilters(moduleFilters.filter(m => m !== module));
    } else {
      setModuleFilters([...moduleFilters, module]);
      debugService.setModuleFilters([...moduleFilters, module]);
    }
  };

  const toggleLevelFilter = (level: LogLevel) => {
    if (levelFilters.includes(level)) {
      setLevelFilters(levelFilters.filter(l => l !== level));
      debugService.setLevelFilters(levelFilters.filter(l => l !== level));
    } else {
      setLevelFilters([...levelFilters, level]);
      debugService.setLevelFilters([...levelFilters, level]);
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error": return "text-red-500";
      case "warn": return "text-yellow-500";
      case "info": return "text-blue-500";
      case "debug": return "text-purple-500";
      default: return "text-gray-500";
    }
  };

  const getModuleColor = (module: ModuleTag) => {
    switch (module) {
      case "matrix": return "bg-blue-100 text-blue-800";
      case "layout": return "bg-green-100 text-green-800";
      case "firebase": return "bg-yellow-100 text-yellow-800";
      case "auth": return "bg-purple-100 text-purple-800";
      case "editor": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Debug Settings</h2>
      <p className="text-muted-foreground">
        Advanced debugging tools for troubleshooting application issues.
      </p>
      
      <Tabs defaultValue="firebase">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="firebase">Firebase</TabsTrigger>
          <TabsTrigger value="logs">Application Logs</TabsTrigger>
          <TabsTrigger value="testing">Component Testing</TabsTrigger>
        </TabsList>
        
        {/* Firebase Diagnostics Tab */}
        <TabsContent value="firebase" className="space-y-4">
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
              <Button onClick={checkFirebaseStatus}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recheck Initialization
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Diagnostic</CardTitle>
              <CardDescription>
                Run a comprehensive diagnostic on Firebase dependencies
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
          
          <FirebaseDebugger />
        </TabsContent>
        
        {/* Application Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>
                View and filter application logs from all modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="space-y-2">
                  <Label>Module Filters</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["matrix", "layout", "firebase", "auth", "editor", "general"] as ModuleTag[]).map(module => (
                      <div key={module} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`module-${module}`} 
                          checked={moduleFilters.includes(module)}
                          onCheckedChange={() => toggleModuleFilter(module)}
                        />
                        <Label htmlFor={`module-${module}`} className="cursor-pointer">
                          <Badge variant="outline" className={getModuleColor(module)}>
                            {module}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 ml-6">
                  <Label>Log Levels</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["info", "log", "warn", "error", "debug"] as LogLevel[]).map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`level-${level}`} 
                          checked={levelFilters.includes(level)}
                          onCheckedChange={() => toggleLevelFilter(level)}
                        />
                        <Label htmlFor={`level-${level}`} className={`cursor-pointer ${getLevelColor(level)}`}>
                          {level}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Info className="h-12 w-12 mb-2 opacity-20" />
                    <p>No logs to display</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={index} className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <Badge variant="outline" className={getModuleColor(log.module)}>
                            {log.module}
                          </Badge>
                          <span className={`text-sm font-medium ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.data && (
                          <div className="mt-2 overflow-auto max-h-32">
                            <pre className="text-xs font-mono bg-black/5 p-2 rounded">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.stackTrace && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">Stack Trace</summary>
                            <pre className="text-xs font-mono bg-black/5 p-2 rounded mt-1 overflow-auto max-h-32">
                              {log.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={clearLogs}>
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Component Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Testing</CardTitle>
              <CardDescription>
                Test specific components and data access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calculation">
                <TabsList className="mb-4">
                  <TabsTrigger value="calculation">Matrix Calculator</TabsTrigger>
                  <TabsTrigger value="layout">Layout Editor</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calculation">
                  <div className="space-y-4">
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="calculationId">Calculation ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="calculationId"
                          value={testId}
                          onChange={(e) => setTestId(e.target.value)}
                          placeholder="Enter calculation ID"
                        />
                        <Button 
                          onClick={testCalculation} 
                          disabled={!testId || testLoading}
                        >
                          {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Test
                        </Button>
                      </div>
                    </div>
                    
                    {testResult && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Result</h3>
                        
                        {testResult.error ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{testResult.error}</AlertDescription>
                          </Alert>
                        ) : testResult.exists ? (
                          <div className="p-3 bg-muted rounded-md">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Calculation found</span>
                            </div>
                            <div className="overflow-auto max-h-60">
                              <pre className="text-xs font-mono">
                                {JSON.stringify(testResult.data, null, 2)}
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
                </TabsContent>
                
                <TabsContent value="layout">
                  <div className="space-y-4">
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="layoutId">Layout ID</Label>
                      <div className="flex gap-2">
                        <Input
                          id="layoutId"
                          value={testId}
                          onChange={(e) => setTestId(e.target.value)}
                          placeholder="Enter layout ID"
                        />
                        <Button 
                          onClick={testLayout} 
                          disabled={!testId || testLoading}
                        >
                          {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Test
                        </Button>
                      </div>
                    </div>
                    
                    {testResult && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Result</h3>
                        
                        {testResult.error ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{testResult.error}</AlertDescription>
                          </Alert>
                        ) : testResult.exists ? (
                          <div className="p-3 bg-muted rounded-md">
                            <div className="flex items-center text-green-600 mb-2">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Layout found</span>
                            </div>
                            <div className="overflow-auto max-h-60">
                              <pre className="text-xs font-mono">
                                {JSON.stringify(testResult.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Not Found</AlertTitle>
                            <AlertDescription>
                              No layout found with the provided ID.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}