
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { firebaseDiagnostics, quickFirestoreCheck, fixFirebaseInitialization } from "@/services/firebase-diagnostics";
import { checkFirebaseInitialization } from "@/services/calculatorDebug";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function FirebaseDiagnosticsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [quickCheckResult, setQuickCheckResult] = useState<any>(null);
  const [fixAttempted, setFixAttempted] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const { user } = useAuth();

  // Run a quick check on page load
  useEffect(() => {
    const runQuickCheck = async () => {
      try {
        const isInitialized = checkFirebaseInitialization();
        setQuickCheckResult({
          success: isInitialized,
          message: isInitialized ? "Firebase is initialized" : "Firebase initialization failed"
        });
      } catch (error) {
        setQuickCheckResult({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    runQuickCheck();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const diagnosticResults = await firebaseDiagnostics.runDiagnostics();
      setResults(diagnosticResults);
    } catch (error) {
      console.error("Error running diagnostics:", error);
      setResults({
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      setLoading(false);
    }
  };

  const runQuickCheck = async () => {
    setLoading(true);
    try {
      const result = await quickFirestoreCheck();
      setQuickCheckResult(result);
    } catch (error) {
      setQuickCheckResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const attemptFix = async () => {
    setLoading(true);
    setFixAttempted(true);
    try {
      const result = fixFirebaseInitialization();
      setFixResult(result);
      
      // Run a quick check after fix attempt
      if (result.success) {
        await runQuickCheck();
      }
    } catch (error) {
      setFixResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Firebase Diagnostics</h1>
      
      {/* Quick Check Result */}
      {quickCheckResult && (
        <Alert className={`mb-6 ${quickCheckResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Firebase Status</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {renderStatusIcon(quickCheckResult.success)}
            {quickCheckResult.success 
              ? "Firebase is properly initialized" 
              : `Firebase initialization issue: ${quickCheckResult.error || "Unknown error"}`}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Fix Attempt Result */}
      {fixAttempted && fixResult && (
        <Alert className={`mb-6 ${fixResult.success ? 'bg-green-50' : 'bg-amber-50'}`}>
          <AlertTitle>Fix Attempt Result</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            {renderStatusIcon(fixResult.success)}
            {fixResult.message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Firebase Check</CardTitle>
            <CardDescription>
              Quickly verify if Firebase is properly initialized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This will check if Firebase is initialized and Firestore is accessible.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={runQuickCheck} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Quick Check
            </Button>
            
            <Button onClick={attemptFix} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Attempt Fix
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Full Diagnostics</CardTitle>
            <CardDescription>
              Run comprehensive Firebase diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This will check all Firebase services including Firestore, Auth, Storage, and Realtime Database.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Full Diagnostics
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
            <CardDescription>
              Detailed results of Firebase diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.firebaseInitialized)}
                  <span>Firebase Initialization</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.firestoreAvailable)}
                  <span>Firestore Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.authAvailable)}
                  <span>Auth Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.storageAvailable)}
                  <span>Storage Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.databaseAvailable)}
                  <span>Realtime Database Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.firestoreReadTest)}
                  <span>Firestore Read Test</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(results.firestoreWriteTest)}
                  <span>Firestore Write Test</span>
                </div>
              </div>
              
              {results.errors && results.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Errors</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* User Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>User Status:</strong> {user ? 'Authenticated' : 'Not Authenticated'}</p>
          {user && (
            <>
              <p><strong>User ID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Firebase Config */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Firebase Configuration</CardTitle>
          <CardDescription>
            Check if environment variables are properly set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Present' : '✗ Missing'}</p>
              <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Present' : '✗ Missing'}</p>
              <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Present' : '✗ Missing'}</p>
            </div>
            <div>
              <p><strong>Storage Bucket:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓ Present' : '✗ Missing'}</p>
              <p><strong>Messaging Sender ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✓ Present' : '✗ Missing'}</p>
              <p><strong>App ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓ Present' : '✗ Missing'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
