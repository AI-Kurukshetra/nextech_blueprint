import type { Metadata } from "next";
import { ClinicalNotesBoard } from "@/components/clinical-notes/clinical-notes-board";
import { CreateClinicalNoteForm } from "@/components/clinical-notes/create-clinical-note-form";
import type {
  ClinicalNoteAppointmentOption,
  ClinicalNoteEntry,
  ClinicalNoteStats,
} from "@/components/clinical-notes/types";
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

type ClinicalNoteRow = Pick<
  Tables<"clinical_notes">,
  | "assessment"
  | "appointment_id"
  | "author_user_id"
  | "created_at"
  | "diagnosis_codes"
  | "id"
  | "is_patient_visible"
  | "note_type"
  | "objective"
  | "patient_id"
  | "plan"
  | "signed_at"
  | "status"
  | "subjective"
>;

type MembershipRow = Pick<Tables<"practice_memberships">, "role" | "user_id">;
type PatientRow = Pick<Tables<"patients">, "chart_number" | "first_name" | "id" | "last_name" | "preferred_name" | "status">;
type ProfileRow = Pick<Tables<"profiles">, "display_name" | "email" | "first_name" | "id" | "last_name">;

export const metadata: Metadata = {
  title: "Clinical Notes",
  description: "Dermatology-first charting with SOAP notes and visibility controls.",
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

export default async function ClinicalNotesPage() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const practiceId = context.practice.id;
  const [
    { data: patientRows, error: patientsError },
    { data: appointmentRows, error: appointmentsError },
    { data: noteRows, error: notesError },
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
      .from("clinical_notes")
      .select(
        "id, patient_id, appointment_id, author_user_id, note_type, status, subjective, objective, assessment, plan, diagnosis_codes, is_patient_visible, signed_at, created_at"
      )
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("practice_memberships")
      .select("user_id, role")
      .eq("practice_id", practiceId)
      .eq("is_active", true),
  ]);

  if (patientsError || appointmentsError || notesError || membershipsError) {
    throw new Error("Clinical notes workspace could not be loaded.");
  }

  const patients = (patientRows as PatientRow[] | null) ?? [];
  const appointments = (appointmentRows as AppointmentRow[] | null) ?? [];
  const notes = (noteRows as ClinicalNoteRow[] | null) ?? [];
  const memberships = (membershipRows as MembershipRow[] | null) ?? [];
  const profileIds = memberships.map((membership) => membership.user_id);
  let profiles: ProfileRow[] = [];

  if (profileIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email, first_name, last_name")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error("Clinical author profiles could not be loaded.");
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
      } satisfies ClinicalNoteAppointmentOption,
    ])
  );
  const patientOptions = patients
    .filter((patient) => patient.status === "active")
    .map((patient) => ({
      chartNumber: patient.chart_number,
      displayName: getPatientDisplayName(patient),
      id: patient.id,
    }));
  const appointmentOptions = appointments.map((appointment) => ({
    appointmentType: appointment.appointment_type,
    id: appointment.id,
    label: formatAppointmentLabel(appointment.starts_at),
    patientId: appointment.patient_id,
    startsAt: appointment.starts_at,
    status: appointment.status,
  }));
  const noteEntries: ClinicalNoteEntry[] = notes.flatMap((note) => {
    const patient = patientById.get(note.patient_id);
    const authorRole = roleByUserId.get(note.author_user_id);

    if (!patient || !authorRole) {
      return [];
    }

    return [
      {
        appointment:
          note.appointment_id && appointmentById.has(note.appointment_id)
            ? appointmentById.get(note.appointment_id) ?? null
            : null,
        assessment: note.assessment,
        author: {
          displayName: getProfileDisplayName(
            profileById.get(note.author_user_id) ?? null
          ),
          role: authorRole,
          userId: note.author_user_id,
        },
        createdAt: note.created_at,
        diagnosisCodes: note.diagnosis_codes,
        id: note.id,
        isPatientVisible: note.is_patient_visible,
        noteType: note.note_type,
        objective: note.objective,
        patient: {
          chartNumber: patient.chart_number,
          displayName: getPatientDisplayName(patient),
          id: patient.id,
        },
        plan: note.plan,
        signedAt: note.signed_at,
        status: note.status,
        subjective: note.subjective,
      },
    ];
  });
  const stats: ClinicalNoteStats = {
    draftCount: noteEntries.filter((note) => note.status === "draft").length,
    patientVisibleCount: noteEntries.filter((note) => note.isPatientVisible).length,
    signedOrAddendumCount: noteEntries.filter(
      (note) => note.status === "signed" || note.status === "addendum"
    ).length,
    totalNotes: noteEntries.length,
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Clinical notes
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              Dermatology charting and SOAP workflows
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Capture SOAP notes, diagnosis codes, and patient-visibility settings
              for {context.practice.name}. The current session role is{" "}
              {formatEnumLabel(context.membership.role)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.totalNotes} notes</Badge>
            <Badge variant="outline">{stats.draftCount} drafts</Badge>
            <Badge variant="outline">{stats.patientVisibleCount} visible to patients</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              SOAP-first workflow
            </CardDescription>
            <CardTitle>Subjective, objective, assessment, plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Capture structured note content in standard charting sections.</p>
            <p>At least one section is required before the draft can be saved.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Diagnosis coding
            </CardDescription>
            <CardTitle>ICD-10 list normalization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Diagnosis codes are normalized, deduplicated, and stored in-array.</p>
            <p>Draft and signed records preserve the charting timeline.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Patient portal controls
            </CardDescription>
            <CardTitle>Visibility governance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Each note can be toggled patient-visible without deleting chart content.</p>
            <p>Visibility remains constrained by existing RLS policy boundaries.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Create clinical note</CardTitle>
            <CardDescription className="text-slate-400">
              Save a new chart note and optionally link it to an appointment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateClinicalNoteForm appointments={appointmentOptions} patients={patientOptions} />
          </CardContent>
        </Card>
        <ClinicalNotesBoard notes={noteEntries} stats={stats} />
      </div>
    </section>
  );
}
