export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-400" />
        Loading
      </div>
    </div>
  );
}
