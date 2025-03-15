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
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className='min-h-screen bg-background'>
      <Sidebar />
      <main className='ml-16 md:ml-64 min-h-screen'>
        <div className='container mx-auto max-w-[2000px] p-6 md:p-8 lg:p-10'>
          {children}
        </div>
      </main>
    </div>
  );
}