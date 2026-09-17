import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.ROLE_MANAGE);

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h2 className="mb-1 text-base font-medium text-black dark:text-zinc-50">
        Roles
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Read-only. Permissions are defined in code (
        <code className="rounded bg-black/[.06] px-1 py-0.5 text-xs dark:bg-white/[.08]">
          lib/auth/permissions.ts
        </code>
        ) — this just shows what&apos;s currently seeded into the database.
        Assign a role to a user from the Users page.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-2xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <h3 className="mb-2 text-sm font-semibold text-black dark:text-zinc-50">
              {role.name}
            </h3>
            {role.permissions.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                No permissions
              </p>
            ) : (
              <ul className="space-y-1">
                {role.permissions.map((rp) => (
                  <li
                    key={rp.permission.key}
                    className="font-mono text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    {rp.permission.key}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
