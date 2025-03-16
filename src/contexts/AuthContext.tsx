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
      if (user) {
        try {
          const userDoc = await userService.getUserByEmail(user.email!);
          setUser(user as AuthUser);
          setRole(userDoc?.role || 'editor');
          
          // If on login page, redirect to projects
          if (router.pathname === '/auth/login') {
            router.push('/dashboard/projects');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole('editor');
        }
      } else {
        setUser(null);
        setRole(null);
        
        // If on protected route, redirect to login
        if (router.pathname.startsWith('/dashboard')) {
          router.push('/auth/login');
        }
      }
      setLoading(false);
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