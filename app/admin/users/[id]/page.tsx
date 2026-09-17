import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { UserForm } from "@/components/admin/user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requirePermission(PERMISSIONS.USER_MANAGE);
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
    },
  });

  if (!user) notFound();

  return (
    <div>
      <h2 className="mb-4 text-base font-medium text-black dark:text-zinc-50">
        Edit user
      </h2>
      <UserForm mode="edit" user={user} isSelf={user.id === currentUser.id} />
    </div>
  );
}
