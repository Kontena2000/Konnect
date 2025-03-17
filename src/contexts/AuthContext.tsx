import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AuthUser, UserRole } from "@/services/auth";
import userService from "@/services/user";
import { useRouter } from 'next/router';

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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userDoc = await userService.getUserByEmail(user.email!);
          setUser(user as AuthUser);
          setRole(userDoc?.role || 'editor');
          
          if (router.pathname === '/auth/login' || router.pathname === '/' || router.pathname === '/auth/register') {
            router.replace('/dashboard/projects');
          }
        } else {
          setUser(null);
          setRole(null);
          
          if (router.pathname.startsWith('/dashboard')) {
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setRole('editor');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);