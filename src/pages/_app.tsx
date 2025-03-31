import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { initializeFirebaseOnStartup } from '@/utils/firebaseInitializer';

export default function App({ Component, pageProps }: AppProps) {
  const isAuthPage = Component.name === 'LoginPage' || Component.name === 'RegisterPage';
  
  // Initialize Firebase as early as possible
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Use the more robust initialization method
        const success = await initializeFirebaseOnStartup();
        
        if (success) {
          console.log('[App] Firebase initialized successfully');
        } else {
          console.error('[App] Firebase initialization failed');
          // Try one more time with a delay
          setTimeout(async () => {
            const retrySuccess = await initializeFirebaseOnStartup();
            console.log(`[App] Firebase retry initialization: ${retrySuccess ? 'success' : 'failed'}`);
          }, 1000);
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
        <AuthProvider>
          <ThemeProvider defaultTheme='system' themes={['light', 'dark', 'design']}>
            <TooltipProvider>
              <Component {...pageProps} />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      )}
    </>
  );
}