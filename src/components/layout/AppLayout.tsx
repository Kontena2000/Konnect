
import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
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
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className={cn(
        "flex-1 min-h-screen",
        isMobile ? "pl-16 pt-4 pr-4" : "p-8"
      )}>
        {children}
      </main>
    </div>
  );
}
