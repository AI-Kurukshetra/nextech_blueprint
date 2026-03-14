import type { Route } from "next";
import Link from "next/link";
import type { DashboardModuleShell } from "@/lib/dashboard/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ModuleShellProps = {
  module: DashboardModuleShell;
  practiceName: string;
  roleLabel: string;
};

export function ModuleShell({
  module,
  practiceName,
  roleLabel,
}: ModuleShellProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          {module.eyebrow}
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">{module.title}</h2>
            <p className="max-w-3xl text-sm text-slate-300">
              {module.description} {practiceName} is already inside the protected
              shell, and the current session role is {roleLabel}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{module.shellStatus}</Badge>
            <Badge variant="outline">{module.href}</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Route status
            </CardDescription>
            <CardTitle>Protected workspace live</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>The route now sits inside the shared authenticated shell.</p>
            <p>The sidebar exposes this module as a primary navigation target.</p>
            <p>Follow-on feature work can build directly in this workspace.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Ready now</CardTitle>
            <CardDescription className="text-slate-400">
              What this shell already establishes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {module.liveNow.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Next build slice</CardTitle>
            <CardDescription className="text-slate-400">
              The implementation work queued behind this shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {module.nextBuild.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Foundation already in place</CardTitle>
            <CardDescription className="text-slate-400">
              Schema, access, and shell work this module can build on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {module.foundations.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardTitle>Connected workspaces</CardTitle>
            <CardDescription className="text-slate-400">
              Related routes already available in the shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {module.relatedWorkspaces.map((workspace) => (
              <Link
                className="block rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:border-sky-400/40 hover:bg-sky-500/10"
                href={workspace.href as Route}
                key={workspace.href}
              >
                <p className="font-medium text-white">{workspace.label}</p>
                <p className="text-sm text-slate-400">{workspace.note}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
