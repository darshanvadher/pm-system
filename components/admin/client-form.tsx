"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ClientFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      client: {
        id: string;
        name: string;
        contactEmail: string | null;
        contactPhone: string | null;
        notes: string | null;
      };
    };

export function ClientForm(props: ClientFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [name, setName] = useState(isEdit ? props.client.name : "");
  const [contactEmail, setContactEmail] = useState(
    isEdit ? (props.client.contactEmail ?? "") : "",
  );
  const [contactPhone, setContactPhone] = useState(
    isEdit ? (props.client.contactPhone ?? "") : "",
  );
  const [notes, setNotes] = useState(isEdit ? (props.client.notes ?? "") : "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        isEdit ? `/api/clients/${props.client.id}` : "/api/clients",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, contactEmail, contactPhone, notes }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push("/admin/clients");
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
          Client name
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
          htmlFor="contactEmail"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Contact email
        </label>
        <input
          id="contactEmail"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none dark:border-white/[.145]"
        />
      </div>

      <div>
        <label
          htmlFor="contactPhone"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Contact phone
        </label>
        <input
          id="contactPhone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none dark:border-white/[.145]"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none dark:border-white/[.145]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-foreground text-background flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create client"}
      </button>
    </form>
  );
}
