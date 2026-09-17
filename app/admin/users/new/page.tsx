import { requirePermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { UserForm } from "@/components/admin/user-form";

export default async function NewUserPage() {
  await requirePermission(PERMISSIONS.USER_MANAGE);

  return (
    <div>
      <h2 className="mb-4 text-base font-medium text-black dark:text-zinc-50">
        New user
      </h2>
      <UserForm mode="create" />
    </div>
  );
}
