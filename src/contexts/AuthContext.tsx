import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth, initializeFirebaseSafely, getAuthSafely } from '@/lib/firebase';
import type { AuthUser, UserRole } from '@/services/auth';
import userService from '@/services/user';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { checkFirebaseInitialization } from '@/utils/firebaseDebug';

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

    // Try to initialize Firebase first
    try {
      initializeFirebaseSafely();
    } catch (error) {
      console.error("Error initializing Firebase in AuthContext:", error);
    }

    // Check Firebase initialization on component mount
    try {
      const isInitialized = checkFirebaseInitialization();
      if (!isInitialized) {
        console.error("Firebase not initialized in AuthContext");
        setInitError("Firebase initialization failed");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking Firebase initialization:", error);
      if (error instanceof Error) {
        setInitError(`Firebase error: ${error.message}`);
      } else {
        setInitError("Unknown Firebase initialization error");
      }
      setLoading(false);
      return;
    }

    // Get auth instance safely
    const safeAuth = getAuthSafely();
    if (!safeAuth) {
      console.error("Failed to get Auth instance in AuthContext");
      setInitError("Failed to get Auth instance");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(safeAuth, async (user) => {
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
        console.error('Error in auth state change:', error);
        
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

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router, toast]);

  // Display Firebase initialization error if it occurs
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>{initError}</p>
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