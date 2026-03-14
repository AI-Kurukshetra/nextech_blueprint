"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createAppointmentSchema,
  isAppointmentStatusTransitionAllowed,
  updateAppointmentStatusSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentStatusInput,
} from "@/lib/validations";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

type ValidationErrors = Record<string, string[] | undefined>;

type AppointmentLookup = {
  check_in_at: string | null;
  completed_at: string | null;
  id: string;
  patient_id: string;
  status: TablesUpdate<"appointments">["status"];
};

export type AppointmentActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

function getValidationState(error: ZodError): AppointmentActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted fields and try again.",
    status: "error",
  };
}

function formatAppointmentDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function getPatientDisplayName(patient: {
  chart_number: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
}) {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  if (patient.preferred_name) {
    return `${fullName} (${patient.preferred_name})`;
  }

  return `${fullName} - ${patient.chart_number}`;
}

function revalidateAppointmentPaths() {
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

async function getPatientForScheduling(
  practiceId: string,
  patientId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, first_name, last_name, preferred_name, chart_number, status")
    .eq("practice_id", practiceId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    return {
      error: "The patient could not be loaded for scheduling.",
      patient: null,
    };
  }

  if (!data) {
    return {
      error: "Select a patient that is visible to your current practice access.",
      patient: null,
    };
  }

  if (data.status !== "active") {
    return {
      error: "Only active patients can be scheduled.",
      patient: null,
    };
  }

  return {
    error: null,
    patient: data,
  };
}

async function getProviderForScheduling(
  practiceId: string,
  providerUserId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_memberships")
    .select("role")
    .eq("practice_id", practiceId)
    .eq("user_id", providerUserId)
    .eq("is_active", true)
    .in("role", ["practice_owner", "provider"])
    .maybeSingle();

  if (error) {
    return {
      error: "The provider could not be loaded for scheduling.",
      provider: null,
    };
  }

  if (!data) {
    return {
      error: "Select an active provider for this appointment.",
      provider: null,
    };
  }

  return {
    error: null,
    provider: data,
  };
}

async function getLocationForScheduling(
  practiceId: string,
  locationId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("id, is_active, name")
    .eq("practice_id", practiceId)
    .eq("id", locationId)
    .maybeSingle();

  if (error) {
    return {
      error: "The location could not be loaded for scheduling.",
      location: null,
    };
  }

  if (!data) {
    return {
      error: "Select a location that is visible to your current practice access.",
      location: null,
    };
  }

  if (!data.is_active) {
    return {
      error: "Appointments can only be created for active locations.",
      location: null,
    };
  }

  return {
    error: null,
    location: data,
  };
}

async function providerHasLocationAccess(
  practiceId: string,
  providerUserId: string,
  providerRole: string,
  locationId: string
) {
  if (providerRole === "practice_owner") {
    return {
      error: null,
      hasAccess: true,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("practice_member_locations")
    .select("location_id")
    .eq("practice_id", practiceId)
    .eq("user_id", providerUserId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) {
    return {
      error: "Provider location access could not be checked.",
      hasAccess: false,
    };
  }

  return {
    error: null,
    hasAccess: Boolean(data),
  };
}

async function getSchedulingConflictMessage(
  practiceId: string,
  schedulingWindow: {
    endsAt: string;
    locationId: string;
    providerUserId: string;
    startsAt: string;
  }
) {
  const supabase = await createClient();
  const activeStatuses = ["scheduled", "checked_in", "in_room"] as const;
  const [providerConflictState, locationConflictState] = await Promise.all([
    supabase
      .from("appointments")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("provider_user_id", schedulingWindow.providerUserId)
      .in("status", activeStatuses)
      .lt("starts_at", schedulingWindow.endsAt)
      .gt("ends_at", schedulingWindow.startsAt)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id")
      .eq("practice_id", practiceId)
      .eq("location_id", schedulingWindow.locationId)
      .in("status", activeStatuses)
      .lt("starts_at", schedulingWindow.endsAt)
      .gt("ends_at", schedulingWindow.startsAt)
      .limit(1)
      .maybeSingle(),
  ]);

  if (providerConflictState.error || locationConflictState.error) {
    return "Existing appointments could not be checked for conflicts.";
  }

  if (providerConflictState.data) {
    return "This provider already has an overlapping appointment in that time window.";
  }

  if (locationConflictState.data) {
    return "This location already has an overlapping appointment in that time window.";
  }

  return null;
}

async function getAppointmentForStatusUpdate(
  practiceId: string,
  appointmentId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, status, check_in_at, completed_at")
    .eq("practice_id", practiceId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    return {
      appointment: null,
      error: "The appointment could not be loaded.",
    };
  }

  if (!data) {
    return {
      appointment: null,
      error: "The appointment is no longer available to your current access scope.",
    };
  }

  return {
    appointment: data as AppointmentLookup,
    error: null,
  };
}

export async function createAppointmentAction(
  _previousState: AppointmentActionState,
  payload: CreateAppointmentInput
): Promise<AppointmentActionState> {
  const parsedPayload = createAppointmentSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const data = parsedPayload.data;
  const [patientState, providerState, locationState] = await Promise.all([
    getPatientForScheduling(context.practice.id, data.patientId),
    getProviderForScheduling(context.practice.id, data.providerUserId),
    getLocationForScheduling(context.practice.id, data.locationId),
  ]);

  if (patientState.error || !patientState.patient) {
    return {
      message: patientState.error ?? "The patient could not be scheduled.",
      status: "error",
    };
  }

  if (providerState.error || !providerState.provider) {
    return {
      message: providerState.error ?? "The provider could not be scheduled.",
      status: "error",
    };
  }

  if (locationState.error || !locationState.location) {
    return {
      message: locationState.error ?? "The location could not be scheduled.",
      status: "error",
    };
  }

  const providerLocationState = await providerHasLocationAccess(
    context.practice.id,
    data.providerUserId,
    providerState.provider.role,
    data.locationId
  );

  if (providerLocationState.error) {
    return {
      message: providerLocationState.error,
      status: "error",
    };
  }

  if (!providerLocationState.hasAccess) {
    return {
      message: "The selected provider is not assigned to that location.",
      status: "error",
    };
  }

  const conflictMessage = await getSchedulingConflictMessage(context.practice.id, {
    endsAt: data.endsAt,
    locationId: data.locationId,
    providerUserId: data.providerUserId,
    startsAt: data.startsAt,
  });

  if (conflictMessage) {
    return {
      message: conflictMessage,
      status: "error",
    };
  }

  const supabase = await createClient();
  const appointmentInsert: TablesInsert<"appointments"> = {
    appointment_type: data.appointmentType,
    created_by_user_id: context.user.id,
    ends_at: data.endsAt,
    location_id: data.locationId,
    notes: data.notes || null,
    patient_id: data.patientId,
    practice_id: context.practice.id,
    provider_user_id: data.providerUserId,
    room_label: data.roomLabel || null,
    starts_at: data.startsAt,
    visit_reason: data.visitReason || null,
  };
  const { error: insertError } = await supabase
    .from("appointments")
    .insert(appointmentInsert);

  if (insertError) {
    return {
      message: "The appointment could not be scheduled. Verify your access and try again.",
      status: "error",
    };
  }

  revalidateAppointmentPaths();

  return {
    message: `Appointment scheduled for ${getPatientDisplayName(
      patientState.patient
    )} at ${formatAppointmentDateTime(
      data.startsAt,
      context.practice.timezone
    )}.`,
    status: "success",
  };
}

export async function updateAppointmentStatusAction(
  _previousState: AppointmentActionState,
  payload: UpdateAppointmentStatusInput
): Promise<AppointmentActionState> {
  const parsedPayload = updateAppointmentStatusSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const appointmentState = await getAppointmentForStatusUpdate(
    context.practice.id,
    parsedPayload.data.appointmentId
  );

  if (appointmentState.error || !appointmentState.appointment) {
    return {
      message:
        appointmentState.error ?? "The appointment could not be updated.",
      status: "error",
    };
  }

  const appointment = appointmentState.appointment;

  if (
    !isAppointmentStatusTransitionAllowed(
      appointment.status ?? "scheduled",
      parsedPayload.data.nextStatus
    )
  ) {
    return {
      message: "That status change is not allowed from the current appointment state.",
      status: "error",
    };
  }

  const nowIso = new Date().toISOString();
  const appointmentUpdate: TablesUpdate<"appointments"> = {
    status: parsedPayload.data.nextStatus,
  };

  if (
    (parsedPayload.data.nextStatus === "checked_in" ||
      parsedPayload.data.nextStatus === "in_room" ||
      parsedPayload.data.nextStatus === "completed") &&
    !appointment.check_in_at
  ) {
    appointmentUpdate.check_in_at = nowIso;
  }

  if (parsedPayload.data.nextStatus === "completed") {
    appointmentUpdate.completed_at = nowIso;
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("appointments")
    .update(appointmentUpdate)
    .eq("practice_id", context.practice.id)
    .eq("id", parsedPayload.data.appointmentId);

  if (updateError) {
    return {
      message: "The appointment status could not be updated.",
      status: "error",
    };
  }

  if (parsedPayload.data.nextStatus === "completed") {
    await supabase
      .from("patients")
      .update({ last_visit_at: nowIso })
      .eq("practice_id", context.practice.id)
      .eq("id", appointment.patient_id);
  }

  revalidateAppointmentPaths();

  return {
    message: `Appointment marked as ${parsedPayload.data.nextStatus.replaceAll(
      "_",
      " "
    )}.`,
    status: "success",
  };
}
