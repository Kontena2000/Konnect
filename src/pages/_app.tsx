import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { bootstrapFirebase } from '@/utils/firebaseBootstrap';
import { FirebaseErrorBoundary } from '@/components/FirebaseErrorBoundary';

// Start Firebase initialization before React renders
// This is critical to ensure Firebase is ready before any components try to use it
bootstrapFirebase().catch(err => 
  console.error('Pre-render Firebase bootstrap failed:', err)
);

export default function App({ Component, pageProps }: AppProps) {
  const isAuthPage = Component.name === 'LoginPage' || Component.name === 'RegisterPage';
  
  // Initialize Firebase as early as possible
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Use the bootstrap utility for initialization
        const success = await bootstrapFirebase();
        
        if (success) {
          console.log('[App] Firebase initialized successfully');
        } else {
          console.error('[App] Firebase initialization failed');
          
          // Try multiple times with increasing delays
          const retryWithDelay = async (attempt: number) => {
            if (attempt > 3) return false;
            
            const delay = 500 * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`[App] Retrying Firebase initialization in ${delay}ms (attempt ${attempt}/3)`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            const retrySuccess = await bootstrapFirebase();
            
            if (retrySuccess) {
              console.log(`[App] Firebase retry initialization successful on attempt ${attempt}`);
              return true;
            }
            
            return retryWithDelay(attempt + 1);
          };
          
          retryWithDelay(1);
        }
      } catch (error) {
        console.error('[App] Error initializing Firebase:', error);
      }
    };
    
    // Initialize Firebase immediately when the app loads
    initFirebase();
  }, []);
  
  return (
    <>
      <Head>
        <title>Konnect | Layout Planner</title>
        <meta name='description' content='Design and visualize layouts with Konnect by Kontena' />
        <meta name='application-name' content='Konnect' />
        <meta name='author' content='Kontena' />
      </Head>
      {isAuthPage ? (
        <ThemeProvider defaultTheme='system' themes={['light', 'dark', 'design']}>
          <TooltipProvider>
            <Component {...pageProps} />
          </TooltipProvider>
        </ThemeProvider>
      ) : (
        <FirebaseErrorBoundary>
          <AuthProvider>
            <ThemeProvider defaultTheme='system' themes={['light', 'dark', 'design']}>
              <TooltipProvider>
                <Component {...pageProps} />
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </AuthProvider>
        </FirebaseErrorBoundary>
      )}
    </>
  );
}