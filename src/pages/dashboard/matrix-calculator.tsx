import { useState, useEffect } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Settings } from "lucide-react";
import { CalculatorComponent } from "@/components/matrix-calculator/CalculatorComponent";
import { SavedCalculations } from "@/components/SavedCalculations";

export default function MatrixCalculatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [savedResults, setSavedResults] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  const handleSaveCalculation = (results: any) => {
    // This function is passed to the CalculatorComponent
    // It will be called when a calculation is saved
    console.log("Calculation saved:", results);
  };

  const handleLoadCalculation = (results: any) => {
    // This function is passed to the SavedCalculations component
    // It will be called when a saved calculation is loaded
    setSavedResults(results);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AppLayout>
      <Head>
        <title>Matrix Calculator | Konnect</title>
        <meta name="description" content="Calculate data center infrastructure requirements" />
      </Head>

      <div className="w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calculator className="h-8 w-8" />
              Matrix Calculator
            </h1>
            <p className="text-muted-foreground">
              Calculate infrastructure requirements for data center deployments
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/settings?tab=matrix-calculator')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Calculator Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {user && (
            <>
              <CalculatorComponent 
                userId={user.uid} 
                userRole={user.role} 
                onSave={handleSaveCalculation}
                initialResults={savedResults}
              />
              <SavedCalculations 
                userId={user.uid} 
                onLoadCalculation={handleLoadCalculation} 
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}