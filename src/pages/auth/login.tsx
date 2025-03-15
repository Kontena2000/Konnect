
import { AuthForm } from "@/components/auth/AuthForm";
import Head from "next/head";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Kontena</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <AuthForm mode="login" />
      </div>
    </>
  );
}
