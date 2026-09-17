import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ClientForm } from "@/components/admin/client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.CLIENT_MANAGE);
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div>
      <h2 className="mb-4 text-base font-medium text-black dark:text-zinc-50">
        Edit client
      </h2>
      <ClientForm mode="edit" client={client} />
    </div>
  );
}
