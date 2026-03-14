"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createClinicalNoteSchema,
  isClinicalNoteStatusTransitionAllowed,
  updateClinicalNoteStatusSchema,
  updateClinicalNoteVisibilitySchema,
  type CreateClinicalNoteInput,
  type UpdateClinicalNoteStatusInput,
  type UpdateClinicalNoteVisibilityInput,
} from "@/lib/validations";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

type ValidationErrors = Record<string, string[] | undefined>;
type ClinicalNoteLookup = Pick<
  TablesUpdate<"clinical_notes">,
  "patient_id" | "signed_at" | "status"
> & { id: string };

export type ClinicalNoteActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

function getValidationState(error: ZodError): ClinicalNoteActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted fields and try again.",
    status: "error",
  };
}

function revalidateClinicalNotePaths() {
  revalidatePath("/clinical-notes");
  revalidatePath("/dashboard");
}

async function appointmentMatchesPatient(
  practiceId: string,
  appointmentId: string,
  patientId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id")
    .eq("practice_id", practiceId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    return {
      error: "The appointment could not be validated for this note.",
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

  return {
    error: null,
    matches: true,
  };
}

async function getClinicalNote(
  practiceId: string,
  noteId: string
): Promise<{
  error: string | null;
  note: ClinicalNoteLookup | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("id, patient_id, status, signed_at")
    .eq("practice_id", practiceId)
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    return {
      error: "The note could not be loaded.",
      note: null,
    };
  }

  if (!data) {
    return {
      error: "The selected note is no longer available.",
      note: null,
    };
  }

  return {
    error: null,
    note: data as ClinicalNoteLookup,
  };
}

function getNoteStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export async function createClinicalNoteAction(
  _previousState: ClinicalNoteActionState,
  payload: CreateClinicalNoteInput
): Promise<ClinicalNoteActionState> {
  const parsedPayload = createClinicalNoteSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const data = parsedPayload.data;

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

  const supabase = await createClient();
  const noteInsert: TablesInsert<"clinical_notes"> = {
    appointment_id: data.appointmentId,
    assessment: data.assessment || null,
    author_user_id: context.user.id,
    diagnosis_codes: data.diagnosisCodes,
    is_patient_visible: data.isPatientVisible,
    note_type: data.noteType,
    objective: data.objective || null,
    patient_id: data.patientId,
    plan: data.plan || null,
    practice_id: context.practice.id,
    subjective: data.subjective || null,
  };
  const { error: insertError } = await supabase
    .from("clinical_notes")
    .insert(noteInsert);

  if (insertError) {
    return {
      message: "The clinical note could not be saved.",
      status: "error",
    };
  }

  revalidateClinicalNotePaths();

  return {
    message: "Clinical note saved as draft.",
    status: "success",
  };
}

export async function updateClinicalNoteStatusAction(
  _previousState: ClinicalNoteActionState,
  payload: UpdateClinicalNoteStatusInput
): Promise<ClinicalNoteActionState> {
  const parsedPayload = updateClinicalNoteStatusSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const noteState = await getClinicalNote(context.practice.id, parsedPayload.data.noteId);

  if (noteState.error || !noteState.note) {
    return {
      message: noteState.error ?? "The note could not be updated.",
      status: "error",
    };
  }

  if (
    !isClinicalNoteStatusTransitionAllowed(
      noteState.note.status ?? "draft",
      parsedPayload.data.nextStatus
    )
  ) {
    return {
      message: "That note status transition is not allowed.",
      status: "error",
    };
  }

  const noteUpdate: TablesUpdate<"clinical_notes"> = {
    status: parsedPayload.data.nextStatus,
  };

  if (parsedPayload.data.nextStatus === "signed") {
    noteUpdate.signed_at = new Date().toISOString();
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("clinical_notes")
    .update(noteUpdate)
    .eq("practice_id", context.practice.id)
    .eq("id", parsedPayload.data.noteId);

  if (updateError) {
    return {
      message: "The note status could not be updated.",
      status: "error",
    };
  }

  revalidateClinicalNotePaths();

  return {
    message: `Clinical note marked as ${getNoteStatusLabel(parsedPayload.data.nextStatus)}.`,
    status: "success",
  };
}

export async function updateClinicalNoteVisibilityAction(
  _previousState: ClinicalNoteActionState,
  payload: UpdateClinicalNoteVisibilityInput
): Promise<ClinicalNoteActionState> {
  const parsedPayload = updateClinicalNoteVisibilitySchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const noteState = await getClinicalNote(context.practice.id, parsedPayload.data.noteId);

  if (noteState.error || !noteState.note) {
    return {
      message: noteState.error ?? "The note visibility could not be updated.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("clinical_notes")
    .update({
      is_patient_visible: parsedPayload.data.isPatientVisible,
    })
    .eq("practice_id", context.practice.id)
    .eq("id", parsedPayload.data.noteId);

  if (updateError) {
    return {
      message: "The note visibility could not be updated.",
      status: "error",
    };
  }

  revalidateClinicalNotePaths();

  return {
    message: parsedPayload.data.isPatientVisible
      ? "This note is now visible in the patient portal."
      : "This note is now hidden from the patient portal.",
    status: "success",
  };
}
