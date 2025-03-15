import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AppLayout } from '@/components/layout/AppLayout';

export default function App({ Component, pageProps }: AppProps) {
  const isAuthPage = Component.name === 'LoginPage' || Component.name === 'RegisterPage';
  
  return isAuthPage ? (
    <Component {...pageProps} />
  ) : (
    <AuthProvider>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
      <Toaster />
    </AuthProvider>
  );
}