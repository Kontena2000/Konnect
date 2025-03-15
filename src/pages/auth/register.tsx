
import { AuthForm } from "@/components/auth/AuthForm";
import Head from "next/head";

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Register | Kontena</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <AuthForm mode="register" />
      </div>
    </>
  );
}
