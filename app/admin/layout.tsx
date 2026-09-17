import Link from "next/link";
import { requireAuth, hasPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Any logged-in user can hit /admin/* — each individual page below gates
  // itself with requirePermission() for the specific thing it manages.
  // The nav just hides links the current user can't use anyway.
  const user = await requireAuth();

  const links = [
    {
      href: "/admin/users",
      label: "Users",
      show: hasPermission(user, PERMISSIONS.USER_MANAGE),
    },
    {
      href: "/admin/roles",
      label: "Roles",
      show: hasPermission(user, PERMISSIONS.ROLE_MANAGE),
    },
    {
      href: "/admin/clients",
      label: "Clients",
      show: hasPermission(user, PERMISSIONS.CLIENT_MANAGE),
    },
  ].filter((link) => link.show);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
            Admin
          </h1>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            ← Back to dashboard
          </Link>
        </div>
        <nav className="mb-6 flex gap-1 border-b border-black/[.08] dark:border-white/[.145]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-t-md px-3 py-2 text-sm text-zinc-600 hover:bg-black/[.03] hover:text-black dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
