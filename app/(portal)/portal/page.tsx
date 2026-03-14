import type { Route } from "next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatEnumLabel } from "@/lib/validations";
import type { Tables } from "@/types/supabase";

type AppointmentRow = Pick<
  Tables<"appointments">,
  "appointment_type" | "ends_at" | "id" | "location_id" | "starts_at" | "status" | "visit_reason"
>;
type BillingRow = Pick<
  Tables<"billing_records">,
  "balance_amount" | "charge_amount" | "cpt_code" | "paid_at" | "service_date" | "status" | "submitted_at"
>;
type DocumentRow = Pick<
  Tables<"patient_documents">,
  "captured_at" | "created_at" | "description" | "document_type" | "file_name" | "id"
>;
type LocationRow = Pick<Tables<"locations">, "id" | "name">;
type NoteRow = Pick<
  Tables<"clinical_notes">,
  "assessment" | "created_at" | "diagnosis_codes" | "id" | "note_type" | "plan" | "signed_at" | "status"
>;
type PatientRow = Pick<
  Tables<"patients">,
  "chart_number" | "first_name" | "id" | "last_name" | "practice_id" | "preferred_name"
>;
type PracticeRow = Pick<Tables<"practices">, "name">;

export const metadata: Metadata = {
  title: "Portal",
  description: "Patient-facing view of appointments, records, and balances.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function getPatientDisplayName(patient: PatientRow) {
  const fullName = `${patient.first_name} ${patient.last_name}`;
  return patient.preferred_name ? `${fullName} (${patient.preferred_name})` : fullName;
}

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, practice_id, first_name, last_name, preferred_name, chart_number")
    .eq("portal_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (patientError) {
    throw new Error("Patient portal context could not be loaded.");
  }

  if (!patient) {
    return (
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-white">Portal access pending</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Your account is signed in, but no patient portal profile is linked yet. Contact
          your practice team to enable portal access.
        </p>
      </section>
    );
  }

  const [
    { data: practiceRow },
    { data: appointmentRows, error: appointmentsError },
    { data: documentRows, error: documentsError },
    { data: noteRows, error: notesError },
    { data: billingRows, error: billingError },
  ] = await Promise.all([
    supabase
      .from("practices")
      .select("name")
      .eq("id", patient.practice_id)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, appointment_type, status, starts_at, ends_at, visit_reason, location_id")
      .eq("practice_id", patient.practice_id)
      .eq("patient_id", patient.id)
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase
      .from("patient_documents")
      .select("id, document_type, file_name, description, captured_at, created_at")
      .eq("practice_id", patient.practice_id)
      .eq("patient_id", patient.id)
      .eq("is_patient_visible", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("clinical_notes")
      .select("id, note_type, status, diagnosis_codes, assessment, plan, signed_at, created_at")
      .eq("practice_id", patient.practice_id)
      .eq("patient_id", patient.id)
      .eq("is_patient_visible", true)
      .in("status", ["signed", "addendum"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("billing_records")
      .select(
        "cpt_code, status, charge_amount, balance_amount, service_date, submitted_at, paid_at"
      )
      .eq("practice_id", patient.practice_id)
      .eq("patient_id", patient.id)
      .order("service_date", { ascending: false })
      .limit(30),
  ]);

  if (appointmentsError || documentsError || notesError || billingError) {
    throw new Error("Patient portal data could not be loaded.");
  }

  const practice = practiceRow as PracticeRow | null;
  const appointments = (appointmentRows as AppointmentRow[] | null) ?? [];
  const documents = (documentRows as DocumentRow[] | null) ?? [];
  const notes = (noteRows as NoteRow[] | null) ?? [];
  const billing = (billingRows as BillingRow[] | null) ?? [];
  const locationIds = [
    ...new Set(
      appointments
        .map((appointment) => appointment.location_id)
        .filter((locationId): locationId is string => Boolean(locationId))
    ),
  ];
  let locations: LocationRow[] = [];

  if (locationIds.length > 0) {
    const { data: locationRows, error: locationsError } = await supabase
      .from("locations")
      .select("id, name")
      .eq("practice_id", patient.practice_id)
      .in("id", locationIds);

    if (locationsError) {
      throw new Error("Portal locations could not be loaded.");
    }

    locations = (locationRows as LocationRow[] | null) ?? [];
  }

  const locationById = new Map(locations.map((location) => [location.id, location]));
  const upcomingAppointments = appointments.filter(
    (appointment) => new Date(appointment.starts_at).getTime() >= Date.now()
  );
  const outstandingBalance = billing.reduce((sum, record) => sum + record.balance_amount, 0);

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300/80">
          Welcome
        </p>
        <h2 className="text-3xl font-semibold text-white">{getPatientDisplayName(patient)}</h2>
        <p className="max-w-3xl text-sm text-slate-200">
          {practice?.name ?? "Your practice"} portal access for chart {patient.chart_number}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-white/15 bg-white/10 text-white">
          <CardHeader>
            <CardDescription className="text-slate-200">Upcoming appointments</CardDescription>
            <CardTitle>{upcomingAppointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-white/15 bg-white/10 text-white">
          <CardHeader>
            <CardDescription className="text-slate-200">Visible records</CardDescription>
            <CardTitle>{documents.length + notes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-white/15 bg-white/10 text-white">
          <CardHeader>
            <CardDescription className="text-slate-200">Outstanding balance</CardDescription>
            <CardTitle>{formatCurrency(outstandingBalance)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-white/15 bg-slate-950/45 text-white">
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription className="text-slate-300">
              Upcoming and recent visits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={appointment.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={appointment.status === "completed" ? "secondary" : "outline"}>
                      {formatEnumLabel(appointment.status)}
                    </Badge>
                    <Badge variant="outline">{formatEnumLabel(appointment.appointment_type)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    {formatDateTime(appointment.starts_at)} to {formatDateTime(appointment.ends_at)}
                  </p>
                  {appointment.location_id ? (
                    <p className="text-sm text-slate-300">
                      Location: {locationById.get(appointment.location_id)?.name ?? "Practice location"}
                    </p>
                  ) : null}
                  {appointment.visit_reason ? (
                    <p className="text-sm text-slate-300">Reason: {appointment.visit_reason}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-300">No appointments available.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/15 bg-slate-950/45 text-white">
          <CardHeader>
            <CardTitle>Billing summary</CardTitle>
            <CardDescription className="text-slate-300">
              Charge and balance status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing.length > 0 ? (
              billing.map((record, index) => (
                <article
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  key={`${record.cpt_code}-${record.service_date}-${index}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={record.status === "paid" ? "secondary" : "outline"}>
                      {formatEnumLabel(record.status)}
                    </Badge>
                    <Badge variant="outline">{record.cpt_code}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    Service date: {formatDate(record.service_date)}
                  </p>
                  <p className="text-sm text-slate-300">
                    Charge: {formatCurrency(record.charge_amount)} | Balance:{" "}
                    {formatCurrency(record.balance_amount)}
                  </p>
                  {record.submitted_at ? (
                    <p className="text-sm text-slate-300">
                      Submitted: {formatDateTime(record.submitted_at)}
                    </p>
                  ) : null}
                  {record.paid_at ? (
                    <p className="text-sm text-slate-300">Paid: {formatDateTime(record.paid_at)}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-300">No billing records available.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-white/15 bg-slate-950/45 text-white">
          <CardHeader>
            <CardTitle>Visible documents</CardTitle>
            <CardDescription className="text-slate-300">
              Documents and clinical photos shared with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.length > 0 ? (
              documents.map((document) => (
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={document.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatEnumLabel(document.document_type)}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{document.file_name}</p>
                  <p className="text-sm text-slate-300">
                    Added: {formatDateTime(document.created_at)}
                    {document.captured_at ? ` | Captured: ${formatDateTime(document.captured_at)}` : ""}
                  </p>
                  {document.description ? (
                    <p className="text-sm text-slate-300">{document.description}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-300">No visible documents yet.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-white/15 bg-slate-950/45 text-white">
          <CardHeader>
            <CardTitle>Visible clinical notes</CardTitle>
            <CardDescription className="text-slate-300">
              Signed or addendum notes shared with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.length > 0 ? (
              notes.map((note) => (
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={note.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={note.status === "addendum" ? "outline" : "secondary"}>
                      {formatEnumLabel(note.status)}
                    </Badge>
                    <Badge variant="outline">{formatEnumLabel(note.note_type)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    Created: {formatDateTime(note.created_at)}
                    {note.signed_at ? ` | Signed: ${formatDateTime(note.signed_at)}` : ""}
                  </p>
                  {note.diagnosis_codes.length > 0 ? (
                    <p className="text-sm text-slate-300">
                      Diagnosis: {note.diagnosis_codes.join(", ")}
                    </p>
                  ) : null}
                  {note.assessment ? (
                    <p className="text-sm text-slate-300">Assessment: {note.assessment}</p>
                  ) : null}
                  {note.plan ? <p className="text-sm text-slate-300">Plan: {note.plan}</p> : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-300">No visible notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
