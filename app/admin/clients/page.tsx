import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { StatusToggleButton } from "@/components/admin/status-toggle-button";

export default async function ClientsPage() {
  await requirePermission(PERMISSIONS.CLIENT_MANAGE);

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-medium text-black dark:text-zinc-50">
          Clients
        </h2>
        <Link
          href="/admin/clients/new"
          className="bg-foreground text-background flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          New client
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[.08] text-xs text-zinc-500 dark:border-white/[.145] dark:text-zinc-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500"
                >
                  No clients yet.
                </td>
              </tr>
            )}
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-black/[.08] last:border-0 dark:border-white/[.145]"
              >
                <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                  {client.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {client.contactEmail || client.contactPhone || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      client.isActive
                        ? "text-xs text-emerald-700 dark:text-emerald-400"
                        : "text-xs text-zinc-500 dark:text-zinc-500"
                    }
                  >
                    {client.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="rounded-full border border-black/[.08] px-3 py-1 text-xs text-zinc-600 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-[#1a1a1a]"
                    >
                      Edit
                    </Link>
                    <StatusToggleButton
                      id={client.id}
                      isActive={client.isActive}
                      endpointBase="/api/clients"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
