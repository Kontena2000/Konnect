import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import authService from "@/services/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      router.push('/dashboard/projects');
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Kontena | Layout Maker</title>
        <meta name='description' content='Design and visualize modular data center solutions' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      
      <main className='flex items-center justify-center min-h-screen'>
        <div className='animate-pulse'>
          <h1 className='text-4xl font-bold'>Loading...</h1>
        </div>
      </main>
    </>
  );
}