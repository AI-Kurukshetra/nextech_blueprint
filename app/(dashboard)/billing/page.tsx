import type { Metadata } from "next";
import { BillingBoard } from "@/components/billing/billing-board";
import { CreateBillingRecordForm } from "@/components/billing/create-billing-record-form";
import type {
  BillingAppointmentOption,
  BillingInsuranceOption,
  BillingProviderOption,
  BillingRecordEntry,
  BillingRecordStats,
} from "@/components/billing/types";
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
  "id" | "patient_id" | "starts_at" | "status"
>;
type BillingRow = Pick<
  Tables<"billing_records">,
  | "allowed_amount"
  | "appointment_id"
  | "balance_amount"
  | "claim_reference"
  | "charge_amount"
  | "cpt_code"
  | "created_at"
  | "icd10_codes"
  | "id"
  | "insurance_policy_id"
  | "modifier_codes"
  | "notes"
  | "paid_at"
  | "patient_id"
  | "rendering_provider_user_id"
  | "service_date"
  | "status"
  | "submitted_at"
  | "units"
>;
type InsuranceRow = Pick<
  Tables<"patient_insurance_policies">,
  "id" | "is_primary" | "member_id" | "patient_id" | "payer_name" | "plan_name"
>;
type MembershipRow = Pick<
  Tables<"practice_memberships">,
  "is_active" | "role" | "user_id"
>;
type PatientRow = Pick<
  Tables<"patients">,
  "chart_number" | "first_name" | "id" | "last_name" | "preferred_name" | "status"
>;
type ProfileRow = Pick<
  Tables<"profiles">,
  "display_name" | "email" | "first_name" | "id" | "last_name"
>;

export const metadata: Metadata = {
  title: "Billing",
  description: "CPT-coded charges, balances, and billing status tracking.",
};

function formatAppointmentLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPatientDisplayName(patient: PatientRow) {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  if (patient.preferred_name) {
    return `${fullName} (${patient.preferred_name})`;
  }

  return fullName;
}

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

  return profile?.email ?? "Practice provider";
}

export default async function BillingPage() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const practiceId = context.practice.id;
  const [
    { data: patientRows, error: patientsError },
    { data: appointmentRows, error: appointmentsError },
    { data: insuranceRows, error: insuranceError },
    { data: membershipRows, error: membershipsError },
    { data: billingRows, error: billingError },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name, preferred_name, chart_number, status")
      .eq("practice_id", practiceId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, patient_id, status, starts_at")
      .eq("practice_id", practiceId)
      .order("starts_at", { ascending: false })
      .limit(250),
    supabase
      .from("patient_insurance_policies")
      .select("id, patient_id, payer_name, plan_name, member_id, is_primary")
      .eq("practice_id", practiceId)
      .order("is_primary", { ascending: false })
      .order("payer_name", { ascending: true }),
    supabase
      .from("practice_memberships")
      .select("user_id, role, is_active")
      .eq("practice_id", practiceId)
      .eq("is_active", true),
    supabase
      .from("billing_records")
      .select(
        "id, patient_id, appointment_id, insurance_policy_id, rendering_provider_user_id, cpt_code, modifier_codes, icd10_codes, claim_reference, units, charge_amount, allowed_amount, balance_amount, status, service_date, submitted_at, paid_at, notes, created_at"
      )
      .eq("practice_id", practiceId)
      .order("service_date", { ascending: false })
      .limit(250),
  ]);

  if (
    patientsError ||
    appointmentsError ||
    insuranceError ||
    membershipsError ||
    billingError
  ) {
    throw new Error("Billing workspace could not be loaded.");
  }

  const patients = (patientRows as PatientRow[] | null) ?? [];
  const appointments = (appointmentRows as AppointmentRow[] | null) ?? [];
  const insurances = (insuranceRows as InsuranceRow[] | null) ?? [];
  const memberships = (membershipRows as MembershipRow[] | null) ?? [];
  const records = (billingRows as BillingRow[] | null) ?? [];
  const profileIds = memberships.map((membership) => membership.user_id);
  let profiles: ProfileRow[] = [];

  if (profileIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email, first_name, last_name")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error("Billing provider profiles could not be loaded.");
    }

    profiles = (profileRows as ProfileRow[] | null) ?? [];
  }

  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const appointmentById = new Map(
    appointments.map((appointment) => [
      appointment.id,
      {
        id: appointment.id,
        label: formatAppointmentLabel(appointment.starts_at),
        patientId: appointment.patient_id,
        status: appointment.status,
      } satisfies BillingAppointmentOption,
    ])
  );
  const insuranceById = new Map(
    insurances.map((insurance) => [
      insurance.id,
      {
        id: insurance.id,
        isPrimary: insurance.is_primary,
        memberId: insurance.member_id,
        patientId: insurance.patient_id,
        payerName: insurance.payer_name,
        planName: insurance.plan_name,
      } satisfies BillingInsuranceOption,
    ])
  );
  const roleByUserId = new Map(
    memberships.map((membership) => [membership.user_id, membership.role])
  );
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const patientOptions = patients
    .filter((patient) => patient.status === "active")
    .map((patient) => ({
      chartNumber: patient.chart_number,
      displayName: getPatientDisplayName(patient),
      id: patient.id,
    }));
  const appointmentOptions = appointments
    .filter((appointment) => appointment.status === "completed")
    .map((appointment) => ({
      id: appointment.id,
      label: formatAppointmentLabel(appointment.starts_at),
      patientId: appointment.patient_id,
      status: appointment.status,
    }));
  const insuranceOptions = Array.from(insuranceById.values());
  const providerOptions: BillingProviderOption[] = memberships
    .filter(
      (membership) =>
        membership.is_active &&
        (membership.role === "practice_owner" || membership.role === "provider")
    )
    .map((membership) => ({
      displayName: getProfileDisplayName(profileById.get(membership.user_id) ?? null),
      role: membership.role,
      userId: membership.user_id,
    }));
  const recordEntries: BillingRecordEntry[] = records.flatMap((record) => {
    const patient = patientById.get(record.patient_id);

    if (!patient) {
      return [];
    }

    const providerRole =
      record.rendering_provider_user_id &&
      roleByUserId.has(record.rendering_provider_user_id)
        ? roleByUserId.get(record.rendering_provider_user_id) ?? null
        : null;

    return [
      {
        allowedAmount: record.allowed_amount,
        appointment:
          record.appointment_id && appointmentById.has(record.appointment_id)
            ? appointmentById.get(record.appointment_id) ?? null
            : null,
        balanceAmount: record.balance_amount,
        claimReference: record.claim_reference,
        chargeAmount: record.charge_amount,
        cptCode: record.cpt_code,
        createdAt: record.created_at,
        icd10Codes: record.icd10_codes,
        id: record.id,
        insurance:
          record.insurance_policy_id && insuranceById.has(record.insurance_policy_id)
            ? insuranceById.get(record.insurance_policy_id) ?? null
            : null,
        modifierCodes: record.modifier_codes,
        notes: record.notes,
        paidAt: record.paid_at,
        patient: {
          chartNumber: patient.chart_number,
          displayName: getPatientDisplayName(patient),
          id: patient.id,
        },
        provider:
          providerRole && record.rendering_provider_user_id
            ? {
                displayName: getProfileDisplayName(
                  profileById.get(record.rendering_provider_user_id) ?? null
                ),
                role: providerRole,
                userId: record.rendering_provider_user_id,
              }
            : null,
        serviceDate: record.service_date,
        status: record.status,
        submittedAt: record.submitted_at,
        units: record.units,
      },
    ];
  });
  const stats: BillingRecordStats = {
    outstandingBalanceTotal: recordEntries.reduce(
      (sum, record) => sum + record.balanceAmount,
      0
    ),
    paidCount: recordEntries.filter((record) => record.status === "paid").length,
    readyOrSubmittedCount: recordEntries.filter(
      (record) => record.status === "ready_to_submit" || record.status === "submitted"
    ).length,
    totalCharges: recordEntries.reduce((sum, record) => sum + record.chargeAmount, 0),
    totalRecords: recordEntries.length,
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Billing
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              CPT charge records and balance tracking
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Manage charge lines, claim-state transitions, and outstanding balances for{" "}
              {context.practice.name}. The current session role is{" "}
              {formatEnumLabel(context.membership.role)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.totalRecords} records</Badge>
            <Badge variant="outline">{stats.paidCount} paid</Badge>
            <Badge variant="outline">{stats.readyOrSubmittedCount} ready/submitted</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Charge capture
            </CardDescription>
            <CardTitle>CPT and ICD-10 linkage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Billing records capture CPT, modifiers, ICD-10 context, and units.</p>
            <p>Completed appointments can be linked directly into charge rows.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Revenue pipeline
            </CardDescription>
            <CardTitle>Status transition controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Track draft, submission, partial payment, paid, denied, and void paths.</p>
            <p>Transition rules are enforced server-side for consistency.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Balance visibility
            </CardDescription>
            <CardTitle>Outstanding amount tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Each record keeps charge, allowed, and remaining balance values.</p>
            <p>Paid transitions automatically zero out the remaining balance.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Create billing record</CardTitle>
            <CardDescription className="text-slate-400">
              Save a charge line with coding, payer context, and balance details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateBillingRecordForm
              appointments={appointmentOptions}
              insurances={insuranceOptions}
              patients={patientOptions}
              providers={providerOptions}
            />
          </CardContent>
        </Card>
        <BillingBoard records={recordEntries} stats={stats} />
      </div>
    </section>
  );
}
