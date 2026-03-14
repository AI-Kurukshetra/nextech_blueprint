"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createPatientDocumentSchema,
  updatePatientDocumentVisibilitySchema,
  type CreatePatientDocumentInput,
  type UpdatePatientDocumentVisibilityInput,
} from "@/lib/validations";
import type { TablesInsert } from "@/types/supabase";

type ValidationErrors = Record<string, string[] | undefined>;

export type DocumentActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialDocumentActionState: DocumentActionState = {
  status: "idle",
};

function getValidationState(error: ZodError): DocumentActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted fields and try again.",
    status: "error",
  };
}

function revalidateDocumentPaths() {
  revalidatePath("/documents");
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
      error: "The appointment could not be validated for this document.",
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

async function ensureDocumentExists(practiceId: string, documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_documents")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    return {
      error: "The document could not be loaded.",
      exists: false,
    };
  }

  return {
    error: data ? null : "The selected document is no longer available.",
    exists: Boolean(data),
  };
}

export async function createPatientDocumentAction(
  _previousState: DocumentActionState,
  payload: CreatePatientDocumentInput
): Promise<DocumentActionState> {
  const parsedPayload = createPatientDocumentSchema.safeParse(payload);

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
  const insertPayload: TablesInsert<"patient_documents"> = {
    appointment_id: data.appointmentId,
    captured_at: data.capturedAt,
    description: data.description || null,
    document_type: data.documentType,
    file_name: data.fileName,
    is_patient_visible: data.isPatientVisible,
    mime_type: data.mimeType,
    patient_id: data.patientId,
    practice_id: context.practice.id,
    storage_bucket: data.storageBucket,
    storage_path: data.storagePath,
    uploaded_by_user_id: context.user.id,
  };
  const { error: insertError } = await supabase
    .from("patient_documents")
    .insert(insertPayload);

  if (insertError) {
    return {
      message: "The document metadata could not be saved.",
      status: "error",
    };
  }

  revalidateDocumentPaths();

  return {
    message: "Document metadata saved.",
    status: "success",
  };
}

export async function updatePatientDocumentVisibilityAction(
  _previousState: DocumentActionState,
  payload: UpdatePatientDocumentVisibilityInput
): Promise<DocumentActionState> {
  const parsedPayload = updatePatientDocumentVisibilitySchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await requireUserPracticeContext();
  const documentState = await ensureDocumentExists(
    context.practice.id,
    parsedPayload.data.documentId
  );

  if (documentState.error || !documentState.exists) {
    return {
      message: documentState.error ?? "The document could not be updated.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("patient_documents")
    .update({
      is_patient_visible: parsedPayload.data.isPatientVisible,
    })
    .eq("practice_id", context.practice.id)
    .eq("id", parsedPayload.data.documentId);

  if (updateError) {
    return {
      message: "The document visibility could not be updated.",
      status: "error",
    };
  }

  revalidateDocumentPaths();

  return {
    message: parsedPayload.data.isPatientVisible
      ? "This document is now visible in the patient portal."
      : "This document is now hidden from the patient portal.",
    status: "success",
  };
}
