"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ROLE_NAMES, type RoleName } from "@/lib/auth/permissions";

type UserFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      user: { id: string; name: string; email: string; role: { name: string } };
      // True when the person editing this form IS this user. The API
      // rejects role/status changes to your own account (see
      // app/api/users/[id]/route.ts), so the form disables that field and
      // omits it from the request entirely rather than letting the user
      // hit a confusing 400 just for changing their own display name.
      isSelf?: boolean;
    };

const ROLE_OPTIONS = Object.values(ROLE_NAMES);

export function UserForm(props: UserFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const isSelf = isEdit && Boolean(props.isSelf);

  const [name, setName] = useState(isEdit ? props.user.name : "");
  const [email, setEmail] = useState(isEdit ? props.user.email : "");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState<RoleName>(
    isEdit ? (props.user.role.name as RoleName) : ROLE_NAMES.DEVELOPER,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        isEdit ? `/api/users/${props.user.id}` : "/api/users",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? isSelf
                ? { name } // roleName omitted entirely — see isSelf comment above
                : { name, roleName }
              : { name, email, password, roleName },
          ),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none dark:border-white/[.145]"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          disabled={isEdit}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none disabled:opacity-50 dark:border-white/[.145]"
        />
        {isEdit && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Email can&apos;t be changed here.
          </p>
        )}
      </div>

      {!isEdit && (
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Initial password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none dark:border-white/[.145]"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Share this with the user directly — there&apos;s no invite-email
            flow yet.
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="role"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Role
        </label>
        <select
          id="role"
          disabled={isSelf}
          value={roleName}
          onChange={(e) => setRoleName(e.target.value as RoleName)}
          className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none disabled:opacity-50 dark:border-white/[.145]"
        >
          {ROLE_OPTIONS.map((role) => (
            <option
              key={role}
              value={role}
              className="bg-background text-foreground"
            >
              {role}
            </option>
          ))}
        </select>
        {isSelf && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            You can&apos;t change your own role. Ask another admin.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-foreground text-background flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create user"}
      </button>
    </form>
  );
}
