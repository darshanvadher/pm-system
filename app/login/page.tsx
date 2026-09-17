import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          PM System
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
