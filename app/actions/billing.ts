"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createBillingRecordSchema,
  isBillingStatusTransitionAllowed,
  updateBillingRecordStatusSchema,
  type CreateBillingRecordInput,
  type UpdateBillingRecordStatusInput,
} from "@/lib/validations";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

type ValidationErrors = Record<string, string[] | undefined>;

type BillingRecordLookup = Pick<
  TablesUpdate<"billing_records">,
  "balance_amount" | "charge_amount" | "status" | "submitted_at"
> & { id: string };

export type BillingActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

function getValidationState(error: ZodError): BillingActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted billing fields and try again.",
    status: "error",
  };
}

function revalidateBillingPaths() {
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

async function patientExistsInPractice(practiceId: string, patientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    return {
      error: "The patient could not be validated for this billing record.",
      exists: false,
    };
  }

  return {
    error: data ? null : "Select a patient in the current practice scope.",
    exists: Boolean(data),
  };
}

async function appointmentMatchesPatient(
  practiceId: string,
  appointmentId: string,
  patientId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, status")
    .eq("practice_id", practiceId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    return {
      error: "The appointment could not be validated for billing.",
      matches: false,
    };
  }

  if (!data) {
    return {
      error: "Select an appointment visible in your current access scope.",
      matches: false,
    };
  }

  if (data.patient_id !== patientId) {
    return {
      error: "The selected appointment does not belong to the selected patient.",
      matches: false,
    };
  }

  if (data.status !== "completed") {
    return {
      error: "Billing records can only be linked to completed appointments.",
      matches: false,
    };
  }

  return {
    error: null,
    matches: true,
  };
}

async function insuranceMatchesPatient(
  practiceId: string,
  insurancePolicyId: string,
  patientId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_insurance_policies")
    .select("id, patient_id")
    .eq("practice_id", practiceId)
    .eq("id", insurancePolicyId)
    .maybeSingle();

  if (error) {
    return {
      error: "Insurance policy validation failed.",
      matches: false,
    };
  }

  if (!data) {
    return {
      error: "Select a policy visible in the current practice scope.",
      matches: false,
    };
  }

  if (data.patient_id !== patientId) {
    return {
      error: "The selected insurance policy does not belong to the selected patient.",
      matches: false,
    };
  }

  return {
    error: null,
    matches: true,
  };
}

async function isValidRenderingProvider(practiceId: string, providerUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_memberships")
    .select("user_id")
    .eq("practice_id", practiceId)
    .eq("user_id", providerUserId)
    .eq("is_active", true)
    .in("role", ["practice_owner", "provider"])
    .maybeSingle();

  if (error) {
    return {
      error: "The rendering provider could not be validated.",
      valid: false,
    };
  }

  return {
    error: data ? null : "Select an active rendering provider in this practice.",
    valid: Boolean(data),
  };
}

async function getBillingRecord(practiceId: string, recordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_records")
    .select("id, status, charge_amount, balance_amount, submitted_at")
    .eq("practice_id", practiceId)
    .eq("id", recordId)
    .maybeSingle();

  if (error) {
    return {
      error: "The billing record could not be loaded.",
      record: null,
    };
  }

  if (!data) {
    return {
      error: "The billing record is no longer available.",
      record: null,
    };
  }

  return {
    error: null,
    record: data as BillingRecordLookup,
  };
}

export async function createBillingRecordAction(
  _previousState: BillingActionState,
  payload: CreateBillingRecordInput
): Promise<BillingActionState> {
  const parsedPayload = createBillingRecordSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const data = parsedPayload.data;
  const patientState = await patientExistsInPractice(context.practice.id, data.patientId);

  if (patientState.error || !patientState.exists) {
    return {
      message: patientState.error ?? "The selected patient is not available.",
      status: "error",
    };
  }

  if (data.appointmentId) {
    const appointmentState = await appointmentMatchesPatient(
      context.practice.id,
      data.appointmentId,
      data.patientId
    );

    if (appointmentState.error || !appointmentState.matches) {
      return {
        message: appointmentState.error ?? "Appointment validation failed.",
        status: "error",
      };
    }
  }

  if (data.insurancePolicyId) {
    const insuranceState = await insuranceMatchesPatient(
      context.practice.id,
      data.insurancePolicyId,
      data.patientId
    );

    if (insuranceState.error || !insuranceState.matches) {
      return {
        message: insuranceState.error ?? "Insurance validation failed.",
        status: "error",
      };
    }
  }

  if (data.renderingProviderUserId) {
    const providerState = await isValidRenderingProvider(
      context.practice.id,
      data.renderingProviderUserId
    );

    if (providerState.error || !providerState.valid) {
      return {
        message: providerState.error ?? "Rendering provider validation failed.",
        status: "error",
      };
    }
  }

  const nowIso = new Date().toISOString();
  const submittedAt =
    data.submittedAt ||
    (data.status === "submitted" || data.status === "partially_paid" || data.status === "paid"
      ? nowIso
      : null);
  const paidAt = data.paidAt || (data.status === "paid" ? nowIso : null);
  const insertPayload: TablesInsert<"billing_records"> = {
    allowed_amount: data.allowedAmount || null,
    appointment_id: data.appointmentId,
    balance_amount: data.status === "paid" ? 0 : data.balanceAmount,
    claim_reference: data.claimReference || null,
    cpt_code: data.cptCode,
    charge_amount: data.chargeAmount,
    icd10_codes: data.icd10Codes,
    insurance_policy_id: data.insurancePolicyId,
    modifier_codes: data.modifierCodes,
    notes: data.notes || null,
    paid_at: paidAt,
    patient_id: data.patientId,
    practice_id: context.practice.id,
    rendering_provider_user_id: data.renderingProviderUserId,
    service_date: data.serviceDate,
    status: data.status,
    submitted_at: submittedAt,
    units: data.units,
  };
  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("billing_records")
    .insert(insertPayload);

  if (insertError) {
    return {
      message: "The billing record could not be saved.",
      status: "error",
    };
  }

  revalidateBillingPaths();

  return {
    message: `Billing record ${data.cptCode} saved.`,
    status: "success",
  };
}

export async function updateBillingRecordStatusAction(
  _previousState: BillingActionState,
  payload: UpdateBillingRecordStatusInput
): Promise<BillingActionState> {
  const parsedPayload = updateBillingRecordStatusSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const recordState = await getBillingRecord(context.practice.id, parsedPayload.data.recordId);

  if (recordState.error || !recordState.record) {
    return {
      message: recordState.error ?? "The billing record could not be updated.",
      status: "error",
    };
  }

  if (
    !isBillingStatusTransitionAllowed(
      recordState.record.status ?? "draft",
      parsedPayload.data.nextStatus
    )
  ) {
    return {
      message: "That status transition is not allowed for the current billing state.",
      status: "error",
    };
  }

  const nowIso = new Date().toISOString();
  const updatePayload: TablesUpdate<"billing_records"> = {
    status: parsedPayload.data.nextStatus,
  };

  if (
    (parsedPayload.data.nextStatus === "submitted" ||
      parsedPayload.data.nextStatus === "partially_paid" ||
      parsedPayload.data.nextStatus === "paid") &&
    !recordState.record.submitted_at
  ) {
    updatePayload.submitted_at = nowIso;
  }

  if (parsedPayload.data.nextStatus === "partially_paid") {
    if (typeof parsedPayload.data.balanceAmount !== "number") {
      return {
        message: "Provide a remaining balance when marking a record partially paid.",
        status: "error",
      };
    }

    if (
      parsedPayload.data.balanceAmount <= 0 ||
      parsedPayload.data.balanceAmount >= Number(recordState.record.charge_amount ?? 0)
    ) {
      return {
        message: "Partial payment balance must be greater than 0 and less than charge.",
        status: "error",
      };
    }

    updatePayload.balance_amount = parsedPayload.data.balanceAmount;
  } else if (parsedPayload.data.nextStatus === "paid") {
    updatePayload.balance_amount = 0;
    updatePayload.paid_at = nowIso;
  } else if (typeof parsedPayload.data.balanceAmount === "number") {
    updatePayload.balance_amount = parsedPayload.data.balanceAmount;
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("billing_records")
    .update(updatePayload)
    .eq("practice_id", context.practice.id)
    .eq("id", parsedPayload.data.recordId);

  if (updateError) {
    return {
      message: "The billing record status could not be updated.",
      status: "error",
    };
  }

  revalidateBillingPaths();

  return {
    message: `Billing record moved to ${parsedPayload.data.nextStatus.replaceAll("_", " ")}.`,
    status: "success",
  };
}
