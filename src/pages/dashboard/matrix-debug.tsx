
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Info, Bug } from 'lucide-react';
import { checkFirebaseInitialization } from '@/utils/firebaseDebug';
import matrixDebugService, { MatrixDebugInfo } from '@/services/matrixDebugService';
import { AppLayout } from '@/components/layout/AppLayout';
import { FirebaseDebugger } from '@/components/matrix-calculator/FirebaseDebugger';

export default function MatrixDebugPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.replace('/dashboard/settings?tab=debug');
    }
  }, [user, router]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Matrix Debug</h1>
            <p className="text-muted-foreground">
              This page has been moved to Settings → Debug
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/settings?tab=debug')}>
            Go to Debug Settings
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
