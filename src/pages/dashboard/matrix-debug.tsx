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
import { initializeFirebaseSafely } from '@/lib/firebase';

... existing code ...