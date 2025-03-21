
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="absolute left-4 top-4 md:left-8 md:top-8"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to login</span>
                </Link>
              </Button>
            </div>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="register" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
