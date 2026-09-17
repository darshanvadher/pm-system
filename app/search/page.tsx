import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/rbac";
import { SearchClient } from "./search-client";

export default async function SearchPage() {
  const currentUser = await requireAuth();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-zinc-400">
          Loading Search Engine...
        </div>
      }
    >
      <SearchClient currentUser={currentUser} />
    </Suspense>
  );
}
