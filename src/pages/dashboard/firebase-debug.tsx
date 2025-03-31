
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { runFirebaseDiagnostic, checkFirebaseStatus, fixFirebaseInitialization, verifyFirebaseEnvironment, runFirebaseHealthCheck } from '@/utils/firebaseDiagnostics';
import { bootstrapFirebase } from '@/utils/firebaseBootstrap';
import { initializeFirebaseServices } from '@/lib/firebase';

export default function FirebaseDebugPage() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  useEffect(() => {
    runInitialDiagnostics();
  }, []);

  const runInitialDiagnostics = async () => {
    setLoading(true);
    try {
      // Run all diagnostics in parallel
      const [health, env, status] = await Promise.all([
        runFirebaseHealthCheck(),
        verifyFirebaseEnvironment(),
        checkFirebaseStatus()
      ]);
      
      setHealthStatus(health);
      setEnvStatus(env);
      setDiagnosticResult({ status });
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    setLoading(true);
    try {
      const result = await runFirebaseDiagnostic();
      setDiagnosticResult(result);
      
      // Also refresh health and env status
      const [health, env] = await Promise.all([
        runFirebaseHealthCheck(),
        verifyFirebaseEnvironment()
      ]);
      
      setHealthStatus(health);
      setEnvStatus(env);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error running full diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const attemptFix = async () => {
    setFixing(true);
    try {
      // Try different initialization methods
      const bootstrapSuccess = await bootstrapFirebase();
      
      if (!bootstrapSuccess) {
        // If bootstrap fails, try direct initialization
        const directSuccess = initializeFirebaseServices();
        
        if (!directSuccess) {
          // If direct initialization fails, try the fix utility
          await fixFirebaseInitialization();
        }
      }
      
      // Run diagnostics again to check if the fix worked
      await runFullDiagnostic();
    } catch (error) {
      console.error('Error fixing Firebase:', error);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Firebase Diagnostics</h1>
          <p className="text-muted-foreground">Troubleshoot and fix Firebase initialization issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={runFullDiagnostic} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={attemptFix} 
            disabled={loading || fixing || (healthStatus?.healthy === true)}
            className="flex items-center gap-2"
          >
            {fixing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {fixing ? 'Fixing...' : 'Fix Issues'}
          </Button>
        </div>
      </div>
      
      {lastRefresh && (
        <p className="text-sm text-muted-foreground mb-4">
          Last refreshed: {lastRefresh}
        </p>
      )}
      
      {/* Health Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Firebase Health Status</CardTitle>
            {healthStatus && (
              <Badge variant={healthStatus.healthy ? "success" : "destructive"}>
                {healthStatus.healthy ? "Healthy" : "Unhealthy"}
              </Badge>
            )}
          </div>
          <CardDescription>Overall Firebase initialization and configuration status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : healthStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span>{healthStatus.status}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Initialization</h3>
                  <div className="space-y-2">
                    {healthStatus.details?.initialization?.initialized ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Firebase is initialized</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Firebase is not initialized</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">App count:</span>
                      <span className="text-sm font-medium">{healthStatus.details?.initialization?.appCount || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Environment Variables</h3>
                  <div className="space-y-1">
                    {healthStatus.details?.environment && Object.entries(healthStatus.details.environment).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {value === "✅ Set" ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span>{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to get Firebase health status</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Diagnostic Results Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Diagnostic Details</CardTitle>
          <CardDescription>Detailed information about Firebase initialization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : diagnosticResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Firebase Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Initialized:</span>
                      <span className="text-sm font-medium">
                        {diagnosticResult.status?.initialized ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">App Count:</span>
                      <span className="text-sm font-medium">{diagnosticResult.status?.appCount || 0}</span>
                    </div>
                    
                    {diagnosticResult.status?.appDetails && (
                      <div>
                        <span className="text-sm font-medium">App Details:</span>
                        <div className="ml-4 mt-1 space-y-1">
                          <div className="text-xs">Name: {diagnosticResult.status.appDetails.name}</div>
                          <div className="text-xs">
                            Options: {Object.entries(diagnosticResult.status.appDetails.options).map(([key, value]: [string, any]) => (
                              <span key={key} className={`inline-block mr-2 ${value ? 'text-green-600' : 'text-red-600'}`}>
                                {key}: {value ? '✓' : '✗'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {diagnosticResult.bootstrapAttempt && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Initialization Attempts</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Bootstrap:</span>
                        <span className="text-sm font-medium">
                          {diagnosticResult.bootstrapAttempt === "✅ Success" ? (
                            <span className="text-green-600">Success</span>
                          ) : (
                            <span className="text-red-600">Failed</span>
                          )}
                        </span>
                      </div>
                      
                      {diagnosticResult.directInitAttempt && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Direct Init:</span>
                          <span className="text-sm font-medium">
                            {diagnosticResult.directInitAttempt === "✅ Success" ? (
                              <span className="text-green-600">Success</span>
                            ) : (
                              <span className="text-red-600">Failed</span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      {diagnosticResult.asyncInitAttempt && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Async Init:</span>
                          <span className="text-sm font-medium">
                            {diagnosticResult.asyncInitAttempt === "✅ Success" ? (
                              <span className="text-green-600">Success</span>
                            ) : (
                              <span className="text-red-600">Failed</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {diagnosticResult.error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{diagnosticResult.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to get diagnostic results</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Troubleshooting Card */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>Common issues and solutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                "No Firebase App has been created" Error
              </h3>
              <p className="text-sm text-muted-foreground">
                This error occurs when Firebase is not properly initialized before being used. Try the following:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Click the "Fix Issues" button above to attempt automatic repair</li>
                <li>Check that all environment variables are properly set</li>
                <li>Refresh the page to trigger initialization again</li>
                <li>Clear browser cache and cookies</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Missing Environment Variables
              </h3>
              <p className="text-sm text-muted-foreground">
                Firebase requires several environment variables to be set in your .env.local file:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
                <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
                <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
                <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
                <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Initialization Order
              </h3>
              <p className="text-sm text-muted-foreground">
                Firebase should be initialized as early as possible in your application:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>The app uses bootstrapFirebase() in _app.tsx before React renders</li>
                <li>AuthContext uses waitForFirebaseBootstrap() to ensure Firebase is ready</li>
                <li>Services use withBootstrappedFirebase() to safely access Firebase</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={runFullDiagnostic} disabled={loading} className="w-full">
            Run Full Diagnostic
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
