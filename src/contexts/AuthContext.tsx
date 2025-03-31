import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { getAuthSafely } from '@/lib/firebase';
import type { AuthUser, UserRole } from '@/services/auth';
import userService from '@/services/user';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { waitForFirebaseBootstrap } from '@/utils/firebaseBootstrap';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};

    const initializeAuth = async () => {
      try {
        // Use the new bootstrap utility to ensure Firebase is initialized
        const bootstrapped = await waitForFirebaseBootstrap();
        if (!bootstrapped) {
          console.error('[AuthContext] Firebase bootstrap failed');
          if (mounted) {
            setInitError('Firebase initialization failed');
            setLoading(false);
          }
          return;
        }

        // Get auth instance safely
        const authInstance = getAuthSafely();
        if (!authInstance) {
          console.error('[AuthContext] Failed to get Auth instance');
          if (mounted) {
            setInitError('Failed to get Auth instance');
            setLoading(false);
          }
          return;
        }
        
        unsubscribe = onAuthStateChanged(authInstance, async (user) => {
          try {
            if (!mounted) return;

            if (user) {
              // Special case for ruud@kontena.eu - always admin
              if (user.email === 'ruud@kontena.eu') {
                if (mounted) {
                  setUser(user as AuthUser);
                  setRole('admin');
                }
              } else {
                // Get the user's ID token result which includes custom claims
                const tokenResult = await getIdTokenResult(user, true);
                const userDoc = await userService.getUserByEmail(user.email!);
                
                if (mounted) {
                  setUser(user as AuthUser);
                  // Use the role from custom claims, fallback to Firestore role
                  setRole(tokenResult.claims.role as UserRole || userDoc?.role || 'editor');
                }
              }

              // Only redirect if we're on auth pages
              if (router.pathname === '/auth/login' || router.pathname === '/' || router.pathname === '/auth/register') {
                router.replace('/dashboard/projects');
              }
            } else {
              if (mounted) {
                setUser(null);
                setRole(null);
              }

              // Only redirect if we're on protected pages
              if (router.pathname.startsWith('/dashboard')) {
                router.replace('/auth/login');
              }
            }
          } catch (error) {
            console.error('[AuthContext] Error in auth state change:', error);
            
            if (mounted) {
              // If error occurs for ruud@kontena.eu, still grant admin access
              if (user?.email === 'ruud@kontena.eu') {
                setRole('admin');
              } else {
                setRole('editor');
                toast({
                  title: 'Authentication Error',
                  description: 'There was a problem verifying your account. Some features may be limited.',
                  variant: 'destructive'
                });
              }
            }
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        });
      } catch (error) {
        console.error('[AuthContext] Error in initialization:', error);
        if (mounted) {
          if (error instanceof Error) {
            setInitError(`Firebase error: ${error.message}`);
          } else {
            setInitError('Unknown Firebase initialization error');
          }
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router, toast]);

  // Display Firebase initialization error if it occurs
  if (initError) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='p-6 bg-card border rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-2'>Firebase Initialization Error</h2>
          <p className='text-destructive'>{initError}</p>
          <p className='mt-4 text-sm text-muted-foreground'>Please refresh the page or contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);