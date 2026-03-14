import type { Metadata } from "next";
import { PatientDirectory } from "@/components/patients/patient-directory";
import { PatientIntakeForm } from "@/components/patients/patient-intake-form";
import type {
  PatientDirectoryEntry,
  PatientDirectoryStats,
} from "@/components/patients/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { formatEnumLabel } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type PatientRow = Pick<
  Tables<"patients">,
  | "allergies"
  | "chart_number"
  | "city"
  | "created_at"
  | "date_of_birth"
  | "dermatology_flags"
  | "email"
  | "first_name"
  | "id"
  | "last_name"
  | "phone"
  | "portal_enabled"
  | "preferred_name"
  | "sex_at_birth"
  | "state_region"
  | "status"
>;

type PrimaryPolicyRow = Pick<
  Tables<"patient_insurance_policies">,
  "member_id" | "patient_id" | "payer_name" | "plan_name"
>;

export const metadata: Metadata = {
  title: "Patients",
  description: "Patient intake and directory workflow for the protected shell.",
};

export default async function PatientsPage() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const [
    { data: patientRows, error: patientsError },
    { data: primaryPolicies, error: policiesError },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "id, chart_number, first_name, last_name, preferred_name, date_of_birth, sex_at_birth, phone, email, city, state_region, allergies, dermatology_flags, portal_enabled, status, created_at"
      )
      .eq("practice_id", context.practice.id)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("patient_insurance_policies")
      .select("patient_id, payer_name, plan_name, member_id")
      .eq("practice_id", context.practice.id)
      .eq("is_primary", true),
  ]);

  if (patientsError || policiesError) {
    throw new Error("Patient intake workspace could not be loaded.");
  }

  const safePrimaryPolicies = (primaryPolicies as PrimaryPolicyRow[] | null) ?? [];
  const safePatientRows = (patientRows as PatientRow[] | null) ?? [];
  const primaryPolicyByPatientId = new Map(
    safePrimaryPolicies.map((policy) => [
      policy.patient_id,
      {
        memberId: policy.member_id,
        payerName: policy.payer_name,
        planName: policy.plan_name,
      },
    ])
  );
  const patients: PatientDirectoryEntry[] = safePatientRows.map((patient) => ({
      allergies: patient.allergies,
      chartNumber: patient.chart_number,
      city: patient.city,
      createdAt: patient.created_at,
      dateOfBirth: patient.date_of_birth,
      dermatologyFlags: patient.dermatology_flags,
      email: patient.email,
      firstName: patient.first_name,
      id: patient.id,
      lastName: patient.last_name,
      phone: patient.phone,
      portalEnabled: patient.portal_enabled,
      preferredName: patient.preferred_name,
      primaryInsurance: primaryPolicyByPatientId.get(patient.id) ?? null,
      sexAtBirth: patient.sex_at_birth,
      stateRegion: patient.state_region,
      status: patient.status,
    }));
  const stats: PatientDirectoryStats = {
    insuredPatientCount: patients.filter((patient) => patient.primaryInsurance).length,
    portalEnabledCount: patients.filter((patient) => patient.portalEnabled).length,
    totalPatients: patients.length,
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Patients
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              Intake and patient directory
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Register patient demographics, contact details, allergies, portal
              linkage, and primary insurance while keeping the live roster visible
              for {context.practice.name}. The current session role is{" "}
              {formatEnumLabel(context.membership.role)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.totalPatients} total patients</Badge>
            <Badge variant="outline">{stats.portalEnabledCount} portal linked</Badge>
            <Badge variant="outline">{stats.insuredPatientCount} insured</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Intake coverage
            </CardDescription>
            <CardTitle>Demographics and contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Capture names, DOB, sex at birth, chart number, and contact info.</p>
            <p>Store allergies and dermatology-specific intake flags in one pass.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Portal readiness
            </CardDescription>
            <CardTitle>Existing account linkage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Link an already-registered portal account by email during intake.</p>
            <p>Leave the field blank to keep the patient internal-only for now.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Revenue foundation
            </CardDescription>
            <CardTitle>Primary insurance capture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Save the primary payer, plan, and member ID from the same intake form.</p>
            <p>These records become the starting point for later billing work.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>New patient intake</CardTitle>
            <CardDescription className="text-slate-400">
              Intake is practice-scoped and can optionally link a portal account plus
              a primary insurance policy in the same submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatientIntakeForm />
          </CardContent>
        </Card>
        <PatientDirectory patients={patients} stats={stats} />
      </div>
    </section>
  );
}
