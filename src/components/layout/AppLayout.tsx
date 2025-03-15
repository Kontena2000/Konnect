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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "pl-[64px] lg:pl-64",
        isMobile ? "pt-4 pr-4" : "p-8"
      )}>
        <div className="container mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
}