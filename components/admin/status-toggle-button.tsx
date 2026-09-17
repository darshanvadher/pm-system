"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Generic "activate/deactivate" toggle for anything with an isActive
 * column, reused across Users and Clients (and probably Projects later).
 * Sends a PATCH rather than DELETE for both directions — the DELETE route
 * handlers exist for REST completeness, but the UI only needs one code
 * path, and PATCH already covers reactivating too.
 */
export function StatusToggleButton({
  id,
  isActive,
  endpointBase,
}: {
  id: string;
  isActive: boolean;
  endpointBase: string; // e.g. "/api/users" or "/api/clients"
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    try {
      const res = await fetch(`${endpointBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-600 transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-[#1a1a1a]"
    >
      {isLoading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
