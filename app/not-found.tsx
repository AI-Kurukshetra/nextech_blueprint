import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-50">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          404
        </p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-sm text-slate-300">
          The page you requested does not exist.
        </p>
        <Link
          className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
          href="/"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
