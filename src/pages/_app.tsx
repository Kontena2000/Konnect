import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const isAuthPage = Component.name === 'LoginPage' || Component.name === 'RegisterPage';
  
  return (
    <>
      <Head>
        <title>Konnect | Layout Planner</title>
        <meta name="description" content="Design and visualize layouts with Konnect by Kontena" />
        <meta name="application-name" content="Konnect" />
        <meta name="author" content="Kontena" />
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