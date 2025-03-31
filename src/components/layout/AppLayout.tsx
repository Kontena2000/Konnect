import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/router";
import authService from "@/services/auth";
import { initializeFirebaseSafely } from '@/lib/firebase';

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean; // Add this prop
  noPadding?: boolean; // Add this prop
}

export function AppLayout({ 
  children,
  fullWidth = false,
  noPadding = false
}: AppLayoutProps) {
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
    <div className='flex min-h-screen w-full overflow-hidden bg-background'>
      <Sidebar />
      <main className={`flex-1 relative overflow-y-auto w-full ${noPadding ? '' : 'pl-16 md:pl-[17rem]'} py-6`}>
        <div className={`container mx-auto px-4 md:px-6 lg:px-8 ${fullWidth ? 'max-w-full' : 'max-w-[2000px]'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}