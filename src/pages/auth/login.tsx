
import { AuthForm } from "@/components/auth/AuthForm";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Konnect</title>
        <meta name="description" content="Sign in to your Konnect account" />
      </Head>
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none" />
        
        <Card className="relative w-full max-w-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <img src="/logo-m8cuqi6n.svg" alt="Konnect Logo" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl text-center font-bold tracking-tighter">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" />
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button variant="link" className="p-0 h-auto font-normal" asChild>
                <Link href="/auth/register">Create one now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
