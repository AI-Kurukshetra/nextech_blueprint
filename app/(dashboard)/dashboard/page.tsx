import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getUserDisplayName,
  requireUserPracticeContext,
} from "@/lib/auth/session";
import {
  dashboardNavigationGroups,
  dashboardNavigationItems,
} from "@/lib/dashboard/navigation";
import { formatEnumLabel } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Protected practice dashboard overview.",
};

export default async function DashboardPage() {
  const context = await requireUserPracticeContext();
  const shellRouteCount = dashboardNavigationItems.length;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Overview
        </p>
        <h2 className="text-3xl font-semibold text-white">
          {context.practice.name}
        </h2>
        <p className="max-w-3xl text-sm text-slate-300">
          {getUserDisplayName(context)} is signed in as{" "}
          {formatEnumLabel(context.membership.role)}. The protected shell now
          spans overview, admin, patients, scheduling, charting, documents,
          billing, and reports under the same practice tenant.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Practice slug
            </CardDescription>
            <CardTitle>{context.practice.slug}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{context.practice.timezone}</Badge>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Specialties
            </CardDescription>
            <CardTitle>Dermatology-first</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {context.practice.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {specialty.replaceAll("_", " ")}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Shell status
            </CardDescription>
            <CardTitle>{shellRouteCount} protected workspaces</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Practice membership, admin setup, and the cross-module shell are active.
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-white">Workspace launchpad</h3>
          <p className="text-sm text-slate-400">
            Every major module now has a protected route and navigation entry.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {dashboardNavigationGroups.map((group) => (
            <Card
              className="border border-white/10 bg-slate-900/70 text-slate-50"
              key={group.id}
            >
              <CardHeader>
                <CardTitle>{group.label}</CardTitle>
                <CardDescription className="text-slate-400">
                  {group.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardNavigationItems
                  .filter((item) => item.groupId === group.id)
                  .map((item) => (
                    <Link
                      className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-sky-400/40 hover:bg-sky-500/10"
                      href={item.href as Route}
                      key={item.href}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="text-sm text-slate-400">
                            {item.description}
                          </p>
                        </div>
                        <Badge
                          variant={item.status === "live" ? "secondary" : "outline"}
                        >
                          {item.status === "live" ? "Live" : "Shell"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Live foundations</CardTitle>
            <CardDescription className="text-slate-400">
              What is already usable before the feature slices land.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Authenticated routing and onboarding guards are enforced.</p>
            <p>Practice onboarding and owner membership provisioning are live.</p>
            <p>Admin now manages staff roles, memberships, and location access.</p>
            <p>The major MVP modules have protected destinations in the shell.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Next build target</CardTitle>
            <CardDescription className="text-slate-400">
              QA hardening and end-to-end coverage for MVP workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>
              Patient intake is now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/patients" as Route}
              >
                the patients workspace
              </Link>
              .
            </p>
            <p>
              Scheduling is now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/appointments" as Route}
              >
                appointments
              </Link>
              , including provider, location, and lifecycle management.
            </p>
            <p>
              Charting is now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/clinical-notes" as Route}
              >
                clinical notes
              </Link>
              , with SOAP documentation and note visibility controls.
            </p>
            <p>
              Documents are now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/documents" as Route}
              >
                documents
              </Link>
              , including metadata capture and portal visibility controls.
            </p>
            <p>
              Billing is now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/billing" as Route}
              >
                billing
              </Link>
              , with CPT-coded charge records, balances, and status transitions.
            </p>
            <p>
              Patient-facing visibility is now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/portal" as Route}
              >
                /portal
              </Link>
              {" "}for appointments, records, and balances.
            </p>
            <p>
              Reporting is now live in{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/reports" as Route}
              >
                reports
              </Link>
              {" "}with throughput and revenue summaries.
            </p>
            <p>
              Next, expand automated test coverage and run the final review pass.
            </p>
            <p>
              Admin remains the setup surface at{" "}
              <Link
                className="text-sky-300 underline-offset-4 hover:underline"
                href={"/admin" as Route}
              >
                /admin
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
