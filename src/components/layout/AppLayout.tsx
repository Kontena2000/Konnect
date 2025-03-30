import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/router";
import authService from "@/services/auth";
import { initializeFirebaseSafely } from "@/services/firebase-initializer";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Try to initialize Firebase first
    initializeFirebaseSafely();
    
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className='flex min-h-screen w-full overflow-hidden bg-background'>
      <Sidebar />
      <main className='flex-1 relative overflow-y-auto w-full pl-16 md:pl-[17rem] py-6'>
        <div className='container mx-auto px-4 md:px-6 lg:px-8 max-w-[2000px]'>
          {children}
        </div>
      </main>
    </div>
  );
}