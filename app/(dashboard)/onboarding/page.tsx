import type { Route } from "next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PracticeOnboardingForm } from "@/components/onboarding/practice-onboarding-form";
import { getCurrentUserPracticeContext, getUserDisplayName } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Practice Setup",
  description: "Create your practice and complete onboarding.",
};

export default async function PracticeOnboardingPage() {
  const context = await getCurrentUserPracticeContext();

  if (!context.user) {
    redirect("/login" as Route);
  }

  if (context.membership && context.practice) {
    redirect("/dashboard" as Route);
  }

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Practice setup
        </p>
        <h2 className="text-3xl font-semibold text-white">
          Welcome, {getUserDisplayName(context)}
        </h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Create your first practice so scheduling, charting, and billing can
          run inside a single tenant boundary.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <PracticeOnboardingForm />
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                What happens next
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                The owner membership is created automatically by the database
                trigger as soon as the practice record is inserted.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>Practice settings are scoped to the new tenant immediately.</li>
              <li>You will land in the protected dashboard after setup.</li>
              <li>Team roles and locations are available once setup completes.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
