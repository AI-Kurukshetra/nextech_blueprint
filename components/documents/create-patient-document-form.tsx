"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createPatientDocumentAction,
  initialDocumentActionState,
  type DocumentActionState,
} from "@/app/actions/documents";
import type {
  DocumentAppointmentOption,
  DocumentPatientOption,
} from "@/components/documents/types";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createPatientDocumentFormSchema,
  documentTypeOptions,
  formatEnumLabel,
  normalizePatientDocumentSubmission,
  type CreatePatientDocumentFormOutput,
  type CreatePatientDocumentFormValues,
} from "@/lib/validations";

type CreatePatientDocumentFormProps = {
  appointments: DocumentAppointmentOption[];
  patients: DocumentPatientOption[];
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

const defaultValues: CreatePatientDocumentFormValues = {
  appointmentId: "",
  capturedAt: "",
  description: "",
  documentType: "clinical_photo",
  fileName: "",
  isPatientVisible: false,
  mimeType: "image/jpeg",
  patientId: "",
  storageBucket: "patient-documents",
  storagePath: "",
};

function applyFieldErrors(
  actionState: DocumentActionState,
  setError: UseFormSetError<CreatePatientDocumentFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof CreatePatientDocumentFormValues, {
      message,
      type: "server",
    });
  }
}

function getPatientLabel(patient: DocumentPatientOption) {
  return `${patient.displayName} - ${patient.chartNumber}`;
}

function getAppointmentLabel(appointment: DocumentAppointmentOption) {
  return `${appointment.label} - ${formatEnumLabel(
    appointment.appointmentType
  )} - ${formatEnumLabel(appointment.status)}`;
}

export function CreatePatientDocumentForm({
  appointments,
  patients,
}: CreatePatientDocumentFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    createPatientDocumentAction,
    initialDocumentActionState
  );
  const router = useRouter();
  const form = useForm<
    CreatePatientDocumentFormValues,
    undefined,
    CreatePatientDocumentFormOutput
  >({
    defaultValues,
    resolver: zodResolver(createPatientDocumentFormSchema),
  });
  const selectedPatientId = form.watch("patientId");
  const filteredAppointments = useMemo(
    () =>
      selectedPatientId
        ? appointments.filter((appointment) => appointment.patientId === selectedPatientId)
        : appointments,
    [appointments, selectedPatientId]
  );
  const hasPrerequisites = patients.length > 0;

  useEffect(() => {
    applyFieldErrors(actionState, form.setError);
  }, [actionState, form]);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    form.reset(defaultValues);
    router.refresh();
  }, [actionState.status, form, router]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    startTransition(() => {
      submitAction(normalizePatientDocumentSubmission(values));
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={submit}>
        <FormStatus
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      form.setValue("appointmentId", "");
                    }}
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  >
                    <option className="bg-slate-950 text-white" value="">
                      Select a patient
                    </option>
                    {patients.map((patient) => (
                      <option
                        className="bg-slate-950 text-white"
                        key={patient.id}
                        value={patient.id}
                      >
                        {getPatientLabel(patient)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment (optional)</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  >
                    <option className="bg-slate-950 text-white" value="">
                      No appointment link
                    </option>
                    {filteredAppointments.map((appointment) => (
                      <option
                        className="bg-slate-950 text-white"
                        key={appointment.id}
                        value={appointment.id}
                      >
                        {getAppointmentLabel(appointment)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document type</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  >
                    {documentTypeOptions.map((option) => (
                      <option className="bg-slate-950 text-white" key={option} value={option}>
                        {formatEnumLabel(option)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="capturedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Captured at (optional)</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    type="datetime-local"
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="fileName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File name</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="lesion-photo-left-cheek.jpg"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="mimeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MIME type</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="image/jpeg"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="storageBucket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage bucket</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="patient-documents"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormDescription>
                  Metadata only in this slice. File upload handling can be layered later.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreatePatientDocumentFormValues>
            control={form.control}
            name="storagePath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage path</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="practice-a/patient-123/2026-03-14/photo-1.jpg"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField<CreatePatientDocumentFormValues>
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <textarea
                  className={textareaClassName}
                  disabled={!hasPrerequisites}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder="Left cheek lesion follow-up image captured before biopsy."
                  ref={field.ref}
                  value={String(field.value ?? "")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField<CreatePatientDocumentFormValues>
          control={form.control}
          name="isPatientVisible"
          render={({ field }) => (
            <FormItem className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <FormLabel>Patient-visible document</FormLabel>
                  <FormDescription>
                    Keep sensitive files hidden until portal-safe review is complete.
                  </FormDescription>
                </div>
                <FormControl>
                  <input
                    checked={Boolean(field.value)}
                    className="mt-1 h-4 w-4 rounded border border-white/20 bg-slate-950 text-sky-400"
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.checked)}
                    ref={field.ref}
                    type="checkbox"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={isPending || !hasPrerequisites} type="submit">
          {isPending ? "Saving document..." : "Save document metadata"}
        </Button>
      </form>
    </Form>
  );
}
