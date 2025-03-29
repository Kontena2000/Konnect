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
import { getMockResults } from '@/services/mockCalculationResults';

export default function MatrixCalculatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Load saved calculations if user is logged in
    if (user && !loading) {
      loadSavedCalculations();
    }
  }, [user, loading]);

  const loadSavedCalculations = async () => {
    if (!user) return;
    
    try {
      const db = getFirestore();
      const calculationsRef = collection(db, 'users', user.uid, 'calculations');
      const calculationsSnapshot = await getDocs(calculationsRef);
      
      const calculations = calculationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSavedCalculations(calculations);
    } catch (error) {
      console.error('Error loading saved calculations:', error);
    }
  };

  const handleSaveCalculation = async (results: any) => {
    await loadSavedCalculations();
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
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                  <h1 className='text-3xl font-bold tracking-tight'>Matrix Calculator</h1>
                  <p className='text-muted-foreground'>
                    Configure and price data center solutions
                  </p>
                </div>
                
                <Button 
                  variant='outline'
                  onClick={() => setShowDemo(!showDemo)}
                >
                  {showDemo ? 'Hide Demo Data' : 'Show Demo Data'}
                </Button>
              </div>
              
              {showDemo ? (
                <div className='bg-muted/50 p-6 rounded-lg border'>
                  <h2 className='text-xl font-bold mb-4'>Demo Data</h2>
                  <p className='mb-4'>This is a demonstration of the calculator with pre-populated results.</p>
                  <CalculatorComponent 
                    userId={user?.uid || 'demo-user'} 
                    userRole={user?.email === 'admin@example.com' ? 'admin' : 'user'}
                    onSave={handleSaveCalculation}
                    initialResults={getMockResults()}
                  />
                </div>
              ) : (
                <CalculatorComponent 
                  userId={user?.uid || 'demo-user'} 
                  userRole={user?.email === 'admin@example.com' ? 'admin' : 'user'}
                  onSave={handleSaveCalculation}
                />
              )}
              
              {savedCalculations.length > 0 && (
                <div className='mt-12'>
                  <h2 className='text-2xl font-bold mb-4'>Saved Calculations</h2>
                  <SavedCalculations 
                    calculations={savedCalculations} 
                    onRefresh={loadSavedCalculations}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}