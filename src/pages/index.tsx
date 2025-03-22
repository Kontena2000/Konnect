
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

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
        <title>Konnect | Layout Planner</title>
        <meta name="description" content="Design and visualize layouts with Konnect by Kontena" />
        <meta name="application-name" content="Konnect" />
        <meta name="author" content="Kontena" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 p-8 rounded-lg border bg-card">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter">Konnect</h1>
            <p className="text-xl text-muted-foreground">Layout Planner</p>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-[200px] mx-auto" />
              <Skeleton className="h-4 w-[160px] mx-auto" />
            </div>
          ) : (
            <div className="animate-pulse">
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
