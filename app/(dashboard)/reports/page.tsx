import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEnumLabel } from "@/lib/validations";
import type { Tables } from "@/types/supabase";

type AppointmentRow = Pick<Tables<"appointments">, "created_at" | "starts_at" | "status">;
type BillingRow = Pick<
  Tables<"billing_records">,
  "balance_amount" | "charge_amount" | "created_at" | "service_date" | "status"
>;
type NoteRow = Pick<Tables<"clinical_notes">, "created_at">;
type DocumentRow = Pick<Tables<"patient_documents">, "created_at">;
type PatientRow = Pick<Tables<"patients">, "portal_enabled" | "status">;

export const metadata: Metadata = {
  title: "Reports",
  description: "Operational reporting for scheduling, billing, and activity trends.",
};

export default async function ReportsPage() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const practiceId = context.practice.id;
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { data: appointmentRows, error: appointmentsError },
    { data: billingRows, error: billingError },
    { data: patientRows, error: patientsError },
    { data: noteRows, error: notesError },
    { data: documentRows, error: documentsError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("status, starts_at, created_at")
      .eq("practice_id", practiceId)
      .gte("starts_at", sixtyDaysAgo)
      .order("starts_at", { ascending: false })
      .limit(1000),
    supabase
      .from("billing_records")
      .select("status, charge_amount, balance_amount, service_date, created_at")
      .eq("practice_id", practiceId)
      .gte("service_date", ninetyDaysAgo)
      .order("service_date", { ascending: false })
      .limit(1000),
    supabase
      .from("patients")
      .select("status, portal_enabled")
      .eq("practice_id", practiceId)
      .limit(2000),
    supabase
      .from("clinical_notes")
      .select("created_at")
      .eq("practice_id", practiceId)
      .gte("created_at", thirtyDaysAgo)
      .limit(2000),
    supabase
      .from("patient_documents")
      .select("created_at")
      .eq("practice_id", practiceId)
      .gte("created_at", thirtyDaysAgo)
      .limit(2000),
  ]);

  if (appointmentsError || billingError || patientsError || notesError || documentsError) {
    throw new Error("Reports workspace could not be loaded.");
  }

  const appointments = (appointmentRows as AppointmentRow[] | null) ?? [];
  const billing = (billingRows as BillingRow[] | null) ?? [];
  const patients = (patientRows as PatientRow[] | null) ?? [];
  const notes = (noteRows as NoteRow[] | null) ?? [];
  const documents = (documentRows as DocumentRow[] | null) ?? [];
  const appointmentStatusCount = {
    cancelled: appointments.filter((item) => item.status === "cancelled").length,
    completed: appointments.filter((item) => item.status === "completed").length,
    noShow: appointments.filter((item) => item.status === "no_show").length,
    scheduled: appointments.filter((item) => item.status === "scheduled").length,
  };
  const billingStatusCount = {
    denied: billing.filter((item) => item.status === "denied").length,
    paid: billing.filter((item) => item.status === "paid").length,
    partiallyPaid: billing.filter((item) => item.status === "partially_paid").length,
    readyOrSubmitted: billing.filter(
      (item) => item.status === "ready_to_submit" || item.status === "submitted"
    ).length,
  };
  const totalCharges = billing.reduce((sum, item) => sum + item.charge_amount, 0);
  const outstandingBalance = billing.reduce((sum, item) => sum + item.balance_amount, 0);
  const patientActivity = {
    activePatients: patients.filter((item) => item.status === "active").length,
    portalEnabled: patients.filter((item) => item.portal_enabled).length,
    totalPatients: patients.length,
  };
  const recordActivity = {
    documentsCreated: documents.length,
    notesCreated: notes.length,
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Reports
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              Throughput and revenue snapshots
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Operational summaries for {context.practice.name}. The current session role is{" "}
              {formatEnumLabel(context.membership.role)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Appointments: 60 days</Badge>
            <Badge variant="outline">Billing: 90 days</Badge>
            <Badge variant="outline">Clinical activity: 30 days</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">Appointments</CardDescription>
            <CardTitle>{appointments.length} recent visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Scheduled: {appointmentStatusCount.scheduled}</p>
            <p>Completed: {appointmentStatusCount.completed}</p>
            <p>Cancelled: {appointmentStatusCount.cancelled}</p>
            <p>No-show: {appointmentStatusCount.noShow}</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">Billing pipeline</CardDescription>
            <CardTitle>{billing.length} recent charge lines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Ready/submitted: {billingStatusCount.readyOrSubmitted}</p>
            <p>Partially paid: {billingStatusCount.partiallyPaid}</p>
            <p>Paid: {billingStatusCount.paid}</p>
            <p>Denied: {billingStatusCount.denied}</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">Patient activity</CardDescription>
            <CardTitle>{patientActivity.totalPatients} patient records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Active patients: {patientActivity.activePatients}</p>
            <p>Portal enabled: {patientActivity.portalEnabled}</p>
            <p>Notes (30d): {recordActivity.notesCreated}</p>
            <p>Documents (30d): {recordActivity.documentsCreated}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Revenue summary</CardTitle>
            <CardDescription className="text-slate-400">
              Based on billing records from the past 90 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>
              Total charges:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalCharges)}
            </p>
            <p>
              Outstanding balance:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(outstandingBalance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Coverage note</CardTitle>
            <CardDescription className="text-slate-400">
              MVP operational reporting baseline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>This view tracks high-signal operational KPIs across scheduling and billing.</p>
            <p>Use these summaries to monitor throughput, cashflow, and portal adoption.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
