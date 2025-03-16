
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard/projects');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return (
    <>
      <Head>
        <title>Konnect | Subtitle Layout Planner</title>
        <meta name="description" content="Design and visualize subtitle layouts with Konnect by Kontena" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Konnect</h1>
          <p className="text-xl text-muted-foreground">Subtitle Layout Planner</p>
          <div className="animate-pulse">
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      </main>
    </>
  );
}
