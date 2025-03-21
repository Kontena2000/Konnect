
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Head from "next/head";
import Link from "next/link";

export default function RegisterPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Register | Konnect</title>
        <meta name="description" content="Create your account to start using Konnect - The Subtitle Layout Planner" />
      </Head>
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-background overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none" />
        
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="absolute left-4 top-4 md:left-8 md:top-8 z-10"
        >
          <Link href="/auth/login">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to login</span>
          </Link>
        </Button>

        <Card className="relative w-full max-w-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <img src="/logo-m8cuqi6n.svg" alt="Konnect Logo" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl text-center font-bold tracking-tighter">
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="register" />
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Button variant="link" className="p-0 h-auto font-normal" asChild>
                <Link href="/auth/login">Sign in instead</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
