"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-50">
        <div className="w-full max-w-lg space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-rose-300">
              Application error
            </p>
            <h1 className="text-3xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-slate-300">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            type="button"
            onClick={reset}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
