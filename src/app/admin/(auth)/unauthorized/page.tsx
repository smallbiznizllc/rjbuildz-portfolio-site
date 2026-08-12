import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b87333]">
          Access denied
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
          Unauthorized
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Your account is signed in but does not have admin access to this CMS.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/admin/login"
            className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Back to login
          </Link>
          <Link
            href="/"
            className="rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Go to site
          </Link>
        </div>
      </div>
    </div>
  );
}
