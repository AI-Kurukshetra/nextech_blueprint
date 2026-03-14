"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUserPracticeContext } from "@/lib/auth/session";
import {
  normalizeChartNumber,
  normalizeDelimitedInput,
  patientIntakeSchema,
  type PatientIntakeInput,
} from "@/lib/validations";
import type { TablesInsert } from "@/types/supabase";

type ValidationErrors = Record<string, string[] | undefined>;
type AdminClient = ReturnType<typeof createAdminClient>;

export type PatientActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

function getValidationState(error: ZodError): PatientActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted fields and try again.",
    status: "error",
  };
}

function getAdminClientOrError() {
  try {
    return {
      client: createAdminClient(),
      error: null,
    };
  } catch {
    return {
      client: null,
      error: "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
    };
  }
}

function getPatientInsertErrorMessage(error: { code?: string; message: string }) {
  if (
    error.code === "23505" ||
    error.message.toLowerCase().includes("patients_practice_chart_number_unique")
  ) {
    return "That chart number is already in use for this practice.";
  }

  return "Patient intake could not be completed. Try again.";
}

function getInsuranceInsertErrorMessage(didRollbackSucceed: boolean) {
  if (didRollbackSucceed) {
    return "Primary insurance could not be saved, so the patient intake was rolled back.";
  }

  return "Primary insurance could not be saved, and the patient record may still exist. Review the roster before retrying.";
}

function hasInsuranceDetails(payload: PatientIntakeInput) {
  return [
    payload.insurancePayerName,
    payload.insurancePlanName,
    payload.insuranceMemberId,
    payload.insuranceGroupNumber,
    payload.insuranceSubscriberName,
    payload.insuranceRelationshipToSubscriber,
  ].some(Boolean);
}

function revalidatePatientPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/patients");
}

async function deleteCreatedPatient(
  adminClient: AdminClient,
  practiceId: string,
  patientId: string
) {
  const { error } = await adminClient
    .from("patients")
    .delete()
    .eq("practice_id", practiceId)
    .eq("id", patientId);

  return !error;
}

export async function createPatientAction(
  _previousState: PatientActionState,
  payload: PatientIntakeInput
): Promise<PatientActionState> {
  const parsedPayload = patientIntakeSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const adminClientState = getAdminClientOrError();

  if (adminClientState.error || !adminClientState.client) {
    return {
      message: adminClientState.error ?? "The admin client is unavailable.",
      status: "error",
    };
  }

  const adminClient = adminClientState.client;
  const data = parsedPayload.data;
  let portalUserId: string | null = null;

  if (data.portalEmail) {
    const normalizedPortalEmail = data.portalEmail.trim().toLowerCase();
    const { data: portalProfile, error: portalProfileError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", normalizedPortalEmail)
      .maybeSingle();

    if (portalProfileError) {
      return {
        message: "Portal account lookup failed. Try again.",
        status: "error",
      };
    }

    if (!portalProfile) {
      return {
        message:
          "No registered portal account exists for that email yet. Ask the patient to create an account first, then link it here.",
        status: "error",
      };
    }

    const { data: existingPortalPatient, error: portalPatientError } =
      await adminClient
        .from("patients")
        .select("id")
        .eq("practice_id", context.practice.id)
        .eq("portal_user_id", portalProfile.id)
        .eq("portal_enabled", true)
        .maybeSingle();

    if (portalPatientError) {
      return {
        message: "Existing portal links could not be checked. Try again.",
        status: "error",
      };
    }

    if (existingPortalPatient) {
      return {
        message:
          "That portal account is already linked to another patient in this practice.",
        status: "error",
      };
    }

    portalUserId = portalProfile.id;
  }

  const normalizedChartNumber = normalizeChartNumber(data.chartNumber);
  const patientInsert: TablesInsert<"patients"> = {
    address_line_1: data.addressLine1 || null,
    address_line_2: data.addressLine2 || null,
    allergies: normalizeDelimitedInput(data.allergiesInput),
    city: data.city || null,
    date_of_birth: data.dateOfBirth,
    dermatology_flags: normalizeDelimitedInput(data.dermatologyFlagsInput),
    email: data.email || null,
    emergency_contact_name: data.emergencyContactName || null,
    emergency_contact_phone: data.emergencyContactPhone || null,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || null,
    portal_enabled: Boolean(portalUserId),
    portal_user_id: portalUserId,
    postal_code: data.postalCode || null,
    practice_id: context.practice.id,
    preferred_name: data.preferredName || null,
    sex_at_birth: data.sexAtBirth,
    state_region: data.stateRegion || null,
    ...(normalizedChartNumber ? { chart_number: normalizedChartNumber } : {}),
  };
  const { data: createdPatient, error: patientError } = await adminClient
    .from("patients")
    .insert(patientInsert)
    .select("id, chart_number")
    .single();

  if (patientError) {
    return {
      message: getPatientInsertErrorMessage(patientError),
      status: "error",
    };
  }

  if (hasInsuranceDetails(data)) {
    const policyInsert: TablesInsert<"patient_insurance_policies"> = {
      group_number: data.insuranceGroupNumber || null,
      is_primary: true,
      member_id: data.insuranceMemberId,
      patient_id: createdPatient.id,
      payer_name: data.insurancePayerName,
      plan_name: data.insurancePlanName || null,
      practice_id: context.practice.id,
      relationship_to_subscriber:
        data.insuranceRelationshipToSubscriber || null,
      subscriber_name: data.insuranceSubscriberName || null,
    };
    const { error: insuranceError } = await adminClient
      .from("patient_insurance_policies")
      .insert(policyInsert);

    if (insuranceError) {
      const didRollbackSucceed = await deleteCreatedPatient(
        adminClient,
        context.practice.id,
        createdPatient.id
      );

      return {
        message: getInsuranceInsertErrorMessage(didRollbackSucceed),
        status: "error",
      };
    }
  }

  revalidatePatientPaths();

  return {
    message: `Patient created with chart number ${createdPatient.chart_number}.`,
    status: "success",
  };
}
