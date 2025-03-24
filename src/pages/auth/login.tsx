import { AuthForm } from "@/components/auth/AuthForm";
import Head from "next/head";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login | Kontena</title>
      </Head>
      <div className='min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8 bg-[url('/bf3884ae-5d08-4799-8af4-9b7e898ee182-m8jsqfnk.png')] bg-cover bg-center bg-no-repeat'>
        <div className='w-full max-w-md'>
          <AuthForm mode='login' />
        </div>
      </div>
    </>
  );
}