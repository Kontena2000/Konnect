
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard/projects");
      } else {
        router.replace("/auth/login");
      }
    }
  }, [user, loading, router]);

  return (
    <>
      <Head>
        <title>Konnect | Subtitle Layout Planner</title>
        <meta name="description" content="Design and visualize subtitle layouts with Konnect by Kontena" />
        <meta name="application-name" content="Konnect" />
        <meta name="author" content="Kontena" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="relative flex items-center justify-center min-h-screen overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('/images/grid-background.png')",
            filter: "brightness(0.9) sepia(20%) hue-rotate(180deg)"
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
        
        <div className="relative text-center space-y-8 p-8 rounded-lg border bg-background/20 backdrop-blur-md shadow-lg max-w-md w-full mx-4">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <img src="/logo-m8cuqi6n.svg" alt="Konnect Logo" className="h-12 w-auto" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Konnect
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Subtitle Layout Planner
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your workspace...</p>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-[80%] mx-auto" />
                <Skeleton className="h-4 w-[60%] mx-auto" />
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="h-1 w-24 mx-auto bg-primary rounded-full" />
              <p className="text-sm text-muted-foreground">Redirecting to your workspace...</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
