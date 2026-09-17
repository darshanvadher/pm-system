import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 text-center font-sans dark:bg-black">
      <h1 className="mb-2 text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
        You don&apos;t have access to this page
      </h1>
      <p className="mb-6 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Your account doesn&apos;t have the permissions needed to view this. If
        you think this is a mistake, contact an administrator.
      </p>
      <Link
        href="/dashboard"
        className="bg-foreground text-background flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
