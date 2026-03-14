import type { Route } from "next";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCurrentUserPracticeContext,
  getUserDisplayName,
} from "@/lib/auth/session";
import { formatEnumLabel } from "@/lib/validations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentUserPracticeContext();

  if (!context.user) {
    redirect("/login" as Route);
  }

  const roleLabel = context.membership
    ? formatEnumLabel(context.membership.role)
    : "setup required";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-0 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/60 p-6 backdrop-blur lg:border-b-0 lg:border-r">
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/80">
                Mahakurukshetra
              </p>
              <h1 className="text-2xl font-semibold text-white">
                {context.practice?.name ?? "Practice setup"}
              </h1>
              <p className="text-sm text-slate-400">
                {context.practice
                  ? `${context.practice.slug} - ${context.practice.timezone}`
                  : "Create your first practice to unlock the protected app."}
              </p>
            </div>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Signed in as
                </p>
                <p className="mt-1 text-base font-medium text-white">
                  {getUserDisplayName(context)}
                </p>
                <p className="text-sm text-slate-400">
                  {context.profile?.email ?? context.user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{roleLabel}</Badge>
                <Badge variant="outline">
                  {context.practice ? "Practice active" : "Onboarding"}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Navigation
              </p>
              <SidebarNav />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Current focus</p>
              <p className="mt-2">
                The protected shell, patient intake, appointment scheduling, and
                clinical notes are live across admin, patients, appointments,
                charting, documents, billing, and reports. The next slice builds
                QA coverage and release hardening.
              </p>
            </div>
            <form action={signOutAction}>
              <Button className="w-full" type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </aside>
        <main className="p-6 md:p-10">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-6 shadow-2xl shadow-slate-950/30 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

