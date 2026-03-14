import type { Metadata } from "next";
import Link from "next/link";

const coreModules = [
  {
    title: "Patient Intake and Directory",
    detail:
      "Demographics, chart number, allergies, portal linking, insurance capture, and searchable directory.",
  },
  {
    title: "Scheduling and Visit Lifecycle",
    detail:
      "Provider + location aware appointment booking with status flow from scheduled to completed.",
  },
  {
    title: "Clinical Documentation",
    detail:
      "Dermatology-first SOAP notes, diagnosis coding, author tracking, and patient visibility controls.",
  },
  {
    title: "Documents and Clinical Photos",
    detail:
      "Document metadata workspace with consent-friendly patient visibility toggles and secure references.",
  },
  {
    title: "Billing and Balances",
    detail:
      "CPT charge workflows, billing status transitions, balance tracking, and payment state updates.",
  },
  {
    title: "Patient Portal and Reports",
    detail:
      "Patient-facing appointments, visible records, and balances plus operational throughput reporting.",
  },
];

const roleCoverage = [
  "Practice Owner",
  "Practice Admin",
  "Provider",
  "Nurse",
  "Medical Assistant",
  "Front Desk",
  "Biller",
  "Patient Portal User",
];

const demoUsers = [
  ["Practice Owner", "owner.demo@nextechblueprint.com"],
  ["Practice Admin", "admin.demo@nextechblueprint.com"],
  ["Provider", "provider.demo@nextechblueprint.com"],
  ["Nurse", "nurse.demo@nextechblueprint.com"],
  ["Medical Assistant", "ma.demo@nextechblueprint.com"],
  ["Front Desk", "frontdesk.demo@nextechblueprint.com"],
  ["Biller", "biller.demo@nextechblueprint.com"],
  ["Patient Portal", "patient.demo@nextechblueprint.com"],
] as const;

export const metadata: Metadata = {
  title: "Nextech Blueprint | Specialty EHR MVP",
  description:
    "One-page overview of the Nextech specialty EHR MVP including modules, workflows, roles, and demo access.",
};

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-14 md:pt-20">
        <div className="inline-flex w-fit items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-1 text-xs tracking-[0.2em] text-cyan-100 uppercase">
          Specialty EHR MVP
        </div>
        <h1 className="max-w-4xl text-4xl leading-tight font-semibold md:text-6xl">
          One platform for intake, scheduling, charting, documents, billing, portal,
          and reporting.
        </h1>
        <p className="max-w-3xl text-base text-slate-300 md:text-lg">
          This delivery maps directly to the PRD scope for a dermatology-first,
          multi-tenant specialty EHR with role-based access, practice onboarding,
          and patient portal support.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
          >
            Open App Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold transition hover:border-slate-500 hover:bg-slate-900"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Core Modules" value="8" />
          <Metric label="Role Types" value="8" />
          <Metric label="Database with RLS" value="Enabled" />
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-14">
        <h2 className="mb-4 text-2xl font-semibold md:text-3xl">Scope Coverage</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {coreModules.map((module) => (
            <details
              key={module.title}
              className="group rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition open:border-cyan-300/50"
            >
              <summary className="cursor-pointer list-none text-lg font-medium group-open:text-cyan-200">
                {module.title}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{module.detail}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-14">
        <h2 className="mb-4 text-2xl font-semibold md:text-3xl">Role Coverage</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {roleCoverage.map((role) => (
            <div
              key={role}
              className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-200"
            >
              {role}
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-20">
        <h2 className="mb-4 text-2xl font-semibold md:text-3xl">Testing Access</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs tracking-[0.2em] uppercase">
            <span>User Type</span>
            <span>Email</span>
          </div>
          {demoUsers.map(([type, email]) => (
            <div key={email} className="grid grid-cols-2 gap-2 border-b border-slate-800/70 px-4 py-3 text-sm last:border-b-0">
              <span className="text-slate-200">{type}</span>
              <span className="text-cyan-200">{email}</span>
            </div>
          ))}
          <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-4 text-sm">
            Password (all users): <span className="font-semibold text-emerald-300">Nextech@12345</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-cyan-200">{value}</p>
    </div>
  );
}
