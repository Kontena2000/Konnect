import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/router";
import authService from "@/services/auth";
import { initializeFirebaseSafely } from '@/lib/firebase';

interface AppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  noPadding?: boolean;
}

export function AppLayout({ children, fullWidth = false, noPadding = false }: AppLayoutProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Try to initialize Firebase first
    try {
      initializeFirebaseSafely();
    } catch (error) {
      console.error("Error initializing Firebase in AppLayout:", error);
    }
    
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className='min-h-screen bg-background'>
      <div className={`
        ${fullWidth ? 'w-full max-w-none' : 'container mx-auto'} 
        ${noPadding ? 'p-0' : 'p-4'}
      `}>
        {children}
      </div>
    </div>
  );
}