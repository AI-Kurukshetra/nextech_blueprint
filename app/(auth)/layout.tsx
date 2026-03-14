import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication routes for the app.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-slate-950/30">
        {children}
      </div>
    </div>
  );
}
