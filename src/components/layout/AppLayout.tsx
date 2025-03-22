
import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/router";
import authService from "@/services/auth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
