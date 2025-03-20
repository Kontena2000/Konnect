
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AuthUser, UserRole } from "@/services/auth";
import userService from "@/services/user";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!mounted) return;

        if (user) {
          const userDoc = await userService.getUserByEmail(user.email!);
          
          if (mounted) {
            setUser(user as AuthUser);
            setRole(userDoc?.role || "editor");
          }

          // Only redirect if we're on auth pages
          if (router.pathname === "/auth/login" || router.pathname === "/" || router.pathname === "/auth/register") {
            router.replace("/dashboard/projects");
          }
        } else {
          if (mounted) {
            setUser(null);
            setRole(null);
          }

          // Only redirect if we're on protected pages
          if (router.pathname.startsWith("/dashboard")) {
            router.replace("/auth/login");
          }
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        
        if (mounted) {
          setRole("editor");
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your account. Some features may be limited.",
            variant: "destructive"
          });
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

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
