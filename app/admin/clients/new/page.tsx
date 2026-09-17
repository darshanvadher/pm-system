import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ClientForm } from "@/components/admin/client-form";

export default async function NewClientPage() {
  await requirePermission(PERMISSIONS.CLIENT_MANAGE);

  return (
    <div>
      <h2 className="mb-4 text-base font-medium text-black dark:text-zinc-50">
        New client
      </h2>
      <ClientForm mode="create" />
    </div>
  );
}
