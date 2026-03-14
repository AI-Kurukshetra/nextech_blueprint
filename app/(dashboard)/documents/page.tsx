import type { Metadata } from "next";
import { CreatePatientDocumentForm } from "@/components/documents/create-patient-document-form";
import { DocumentsBoard } from "@/components/documents/documents-board";
import type {
  DocumentAppointmentOption,
  DocumentPatientOption,
  PatientDocumentEntry,
  PatientDocumentStats,
} from "@/components/documents/types";
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

type AppointmentRow = Pick<
  Tables<"appointments">,
  "appointment_type" | "id" | "patient_id" | "starts_at" | "status"
>;

type DocumentRow = Pick<
  Tables<"patient_documents">,
  | "appointment_id"
  | "captured_at"
  | "created_at"
  | "description"
  | "document_type"
  | "file_name"
  | "id"
  | "is_patient_visible"
  | "mime_type"
  | "patient_id"
  | "storage_bucket"
  | "storage_path"
  | "uploaded_by_user_id"
>;

type MembershipRow = Pick<Tables<"practice_memberships">, "role" | "user_id">;
type PatientRow = Pick<
  Tables<"patients">,
  "chart_number" | "first_name" | "id" | "last_name" | "preferred_name" | "status"
>;
type ProfileRow = Pick<
  Tables<"profiles">,
  "display_name" | "email" | "first_name" | "id" | "last_name"
>;

export const metadata: Metadata = {
  title: "Documents",
  description: "Clinical photo and document metadata with patient visibility controls.",
};

function getProfileDisplayName(profile: ProfileRow | null) {
  if (profile?.display_name) {
    return profile.display_name;
  }

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return profile?.email ?? "Practice member";
}

function getPatientDisplayName(patient: PatientRow) {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  if (patient.preferred_name) {
    return `${fullName} (${patient.preferred_name})`;
  }

  return fullName;
}

function formatAppointmentLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DocumentsPage() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const practiceId = context.practice.id;
  const [
    { data: patientRows, error: patientsError },
    { data: appointmentRows, error: appointmentsError },
    { data: documentRows, error: documentsError },
    { data: membershipRows, error: membershipsError },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name, preferred_name, chart_number, status")
      .eq("practice_id", practiceId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, patient_id, appointment_type, status, starts_at")
      .eq("practice_id", practiceId)
      .order("starts_at", { ascending: false })
      .limit(200),
    supabase
      .from("patient_documents")
      .select(
        "id, patient_id, appointment_id, uploaded_by_user_id, document_type, file_name, mime_type, storage_bucket, storage_path, description, captured_at, is_patient_visible, created_at"
      )
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("practice_memberships")
      .select("user_id, role")
      .eq("practice_id", practiceId)
      .eq("is_active", true),
  ]);

  if (patientsError || appointmentsError || documentsError || membershipsError) {
    throw new Error("Documents workspace could not be loaded.");
  }

  const patients = (patientRows as PatientRow[] | null) ?? [];
  const appointments = (appointmentRows as AppointmentRow[] | null) ?? [];
  const documents = (documentRows as DocumentRow[] | null) ?? [];
  const memberships = (membershipRows as MembershipRow[] | null) ?? [];
  const profileIds = memberships.map((membership) => membership.user_id);
  let profiles: ProfileRow[] = [];

  if (profileIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email, first_name, last_name")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error("Document author profiles could not be loaded.");
    }

    profiles = (profileRows as ProfileRow[] | null) ?? [];
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const roleByUserId = new Map(
    memberships.map((membership) => [membership.user_id, membership.role])
  );
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const appointmentById = new Map(
    appointments.map((appointment) => [
      appointment.id,
      {
        appointmentType: appointment.appointment_type,
        id: appointment.id,
        label: formatAppointmentLabel(appointment.starts_at),
        patientId: appointment.patient_id,
        startsAt: appointment.starts_at,
        status: appointment.status,
      } satisfies DocumentAppointmentOption,
    ])
  );
  const patientOptions: DocumentPatientOption[] = patients
    .filter((patient) => patient.status === "active")
    .map((patient) => ({
      chartNumber: patient.chart_number,
      displayName: getPatientDisplayName(patient),
      id: patient.id,
    }));
  const appointmentOptions: DocumentAppointmentOption[] = appointments.map((appointment) => ({
    appointmentType: appointment.appointment_type,
    id: appointment.id,
    label: formatAppointmentLabel(appointment.starts_at),
    patientId: appointment.patient_id,
    startsAt: appointment.starts_at,
    status: appointment.status,
  }));
  const documentEntries: PatientDocumentEntry[] = documents.flatMap((document) => {
    const patient = patientById.get(document.patient_id);

    if (!patient) {
      return [];
    }

    const authorRole =
      document.uploaded_by_user_id && roleByUserId.has(document.uploaded_by_user_id)
        ? roleByUserId.get(document.uploaded_by_user_id) ?? null
        : null;

    return [
      {
        appointment:
          document.appointment_id && appointmentById.has(document.appointment_id)
            ? appointmentById.get(document.appointment_id) ?? null
            : null,
        author:
          authorRole && document.uploaded_by_user_id
            ? {
                displayName: getProfileDisplayName(
                  profileById.get(document.uploaded_by_user_id) ?? null
                ),
                role: authorRole,
                userId: document.uploaded_by_user_id,
              }
            : null,
        capturedAt: document.captured_at,
        createdAt: document.created_at,
        description: document.description,
        documentType: document.document_type,
        fileName: document.file_name,
        id: document.id,
        isPatientVisible: document.is_patient_visible,
        mimeType: document.mime_type,
        patient: {
          chartNumber: patient.chart_number,
          displayName: getPatientDisplayName(patient),
          id: patient.id,
        },
        storageBucket: document.storage_bucket,
        storagePath: document.storage_path,
      },
    ];
  });
  const stats: PatientDocumentStats = {
    patientVisibleCount: documentEntries.filter((document) => document.isPatientVisible).length,
    photoCount: documentEntries.filter((document) => document.documentType === "clinical_photo")
      .length,
    totalDocuments: documentEntries.length,
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Documents
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              Clinical photos and patient document metadata
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Track document references, classify uploads, and control portal visibility
              for {context.practice.name}. The current session role is{" "}
              {formatEnumLabel(context.membership.role)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.totalDocuments} records</Badge>
            <Badge variant="outline">{stats.photoCount} clinical photos</Badge>
            <Badge variant="outline">{stats.patientVisibleCount} visible to patients</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Metadata-first storage
            </CardDescription>
            <CardTitle>Secure path and bucket capture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Store bucket and path references without exposing privileged storage keys.</p>
            <p>Upload transport can be layered later without changing core metadata shape.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Consent-friendly visibility
            </CardDescription>
            <CardTitle>Patient portal controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Keep sensitive files hidden until chart review confirms portal readiness.</p>
            <p>Visibility remains constrained by existing RLS policy boundaries.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Appointment linkage
            </CardDescription>
            <CardTitle>Visit context for records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Optionally link each document to a visit for timeline consistency.</p>
            <p>Patient and appointment relationship checks are validated server-side.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Create document metadata</CardTitle>
            <CardDescription className="text-slate-400">
              Save clinical photo and document references with optional visit linkage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePatientDocumentForm
              appointments={appointmentOptions}
              patients={patientOptions}
            />
          </CardContent>
        </Card>
        <DocumentsBoard documents={documentEntries} stats={stats} />
      </div>
    </section>
  );
}
