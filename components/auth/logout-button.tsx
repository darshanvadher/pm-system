"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-full border border-black/[.08] px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
    >
      {isLoading ? "Signing out…" : "Sign out"}
    </button>
  );
}
