
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutGrid, Calculator, Users, Settings } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard/projects");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 p-8 rounded-lg border bg-card">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter">Konnect</h1>
            <p className="text-xl text-muted-foreground">Layout Planner</p>
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-4 w-[200px] mx-auto" />
            <Skeleton className="h-4 w-[160px] mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <>
      <Head>
        <title>Konnect | Layout Planner</title>
        <meta name="description" content="Design and visualize layouts with Konnect by Kontena" />
        <meta name="application-name" content="Konnect" />
        <meta name="author" content="Kontena" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex flex-col min-h-screen">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-m8cuqi6n.svg"
                alt="Kontena Logo"
                width={140}
                height={32}
                priority
              />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          </div>
        </header>
        
        <main>
          {/* Hero Section */}
          <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Design and visualize layouts with ease
                </h1>
                <p className="text-xl text-muted-foreground">
                  Konnect is a powerful layout planning tool that helps you design, visualize, and optimize your layouts in 3D.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline">
                      Log in
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/bf3884ae-5d08-4799-8af4-9b7e898ee182-m8jsqfnk.png"
                  alt="Konnect Layout Planner"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Powerful features for efficient layout planning
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to design, visualize, and optimize your layouts in one place.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">3D Layout Editor</h3>
                  <p className="text-muted-foreground">
                    Design and visualize your layouts in 3D with our intuitive editor.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Matrix Calculator</h3>
                  <p className="text-muted-foreground">
                    Calculate and optimize your layout parameters with our advanced calculator.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Collaboration</h3>
                  <p className="text-muted-foreground">
                    Share your projects with team members and clients for seamless collaboration.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Customization</h3>
                  <p className="text-muted-foreground">
                    Customize your layouts with a wide range of modules and components.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of users who are already using Konnect to design and visualize their layouts.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors">
                  Sign up for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        </main>
        
        <footer className="border-t py-8 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <Image
                  src="/logo-m8cuqi6n.svg"
                  alt="Kontena Logo"
                  width={120}
                  height={30}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  © {new Date().getFullYear()} Kontena. All rights reserved.
                </p>
              </div>
              <div className="flex gap-6">
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Log in
                </Link>
                <Link href="/auth/register" className="text-sm text-muted-foreground hover:text-foreground">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
