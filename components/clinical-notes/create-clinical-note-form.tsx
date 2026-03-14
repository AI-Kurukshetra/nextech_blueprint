"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createClinicalNoteAction,
  type ClinicalNoteActionState,
} from "@/app/actions/clinical-notes";
import type {
  ClinicalNoteAppointmentOption,
  ClinicalNotePatientOption,
} from "@/components/clinical-notes/types";
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
  clinicalNoteTypeOptions,
  createClinicalNoteFormSchema,
  formatEnumLabel,
  normalizeClinicalNoteSubmission,
  type CreateClinicalNoteFormOutput,
  type CreateClinicalNoteFormValues,
} from "@/lib/validations";

type CreateClinicalNoteFormProps = {
  appointments: ClinicalNoteAppointmentOption[];
  patients: ClinicalNotePatientOption[];
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
const textareaClassName =
  "flex min-h-28 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

const defaultValues: CreateClinicalNoteFormValues = {
  appointmentId: "",
  assessment: "",
  diagnosisCodesInput: "",
  isPatientVisible: false,
  noteType: "soap",
  objective: "",
  patientId: "",
  plan: "",
  subjective: "",
};
const initialClinicalNoteActionState: ClinicalNoteActionState = { status: "idle" };

function applyFieldErrors(
  actionState: ClinicalNoteActionState,
  setError: UseFormSetError<CreateClinicalNoteFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof CreateClinicalNoteFormValues, {
      message,
      type: "server",
    });
  }
}

function getPatientLabel(patient: ClinicalNotePatientOption) {
  return `${patient.displayName} - ${patient.chartNumber}`;
}

function getAppointmentLabel(appointment: ClinicalNoteAppointmentOption) {
  return `${appointment.label} - ${formatEnumLabel(
    appointment.appointmentType
  )} - ${formatEnumLabel(appointment.status)}`;
}

export function CreateClinicalNoteForm({
  appointments,
  patients,
}: CreateClinicalNoteFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    createClinicalNoteAction,
    initialClinicalNoteActionState
  );
  const router = useRouter();
  const form = useForm<
    CreateClinicalNoteFormValues,
    undefined,
    CreateClinicalNoteFormOutput
  >({
    defaultValues,
    resolver: zodResolver(createClinicalNoteFormSchema),
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
      submitAction(normalizeClinicalNoteSubmission(values));
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={submit}>
        <FormStatus
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
        {!hasPrerequisites ? (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300">
            Clinical charting needs at least one active patient in the directory.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateClinicalNoteFormValues>
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
          <FormField<CreateClinicalNoteFormValues>
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
                <FormDescription>
                  If selected, the appointment must belong to the chosen patient.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateClinicalNoteFormValues>
            control={form.control}
            name="noteType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note type</FormLabel>
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
                    {clinicalNoteTypeOptions.map((option) => (
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
          <FormField<CreateClinicalNoteFormValues>
            control={form.control}
            name="diagnosisCodesInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diagnosis codes</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="L70.0, L81.4, C44.91"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormDescription>
                  Separate multiple ICD-10 codes with commas, semicolons, or new lines.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateClinicalNoteFormValues>
            control={form.control}
            name="subjective"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subjective</FormLabel>
                <FormControl>
                  <textarea
                    className={textareaClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="Patient-reported symptoms and history."
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateClinicalNoteFormValues>
            control={form.control}
            name="objective"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objective</FormLabel>
                <FormControl>
                  <textarea
                    className={textareaClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="Physical exam findings and measured observations."
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
          <FormField<CreateClinicalNoteFormValues>
            control={form.control}
            name="assessment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assessment</FormLabel>
                <FormControl>
                  <textarea
                    className={textareaClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="Clinical impression and diagnosis rationale."
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateClinicalNoteFormValues>
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan</FormLabel>
                <FormControl>
                  <textarea
                    className={textareaClassName}
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="Treatment plan, prescriptions, and follow-up actions."
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField<CreateClinicalNoteFormValues>
          control={form.control}
          name="isPatientVisible"
          render={({ field }) => (
            <FormItem className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <FormLabel>Patient-visible note</FormLabel>
                  <FormDescription>
                    Enable this only when the note content is safe for portal viewing.
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
          {isPending ? "Saving note..." : "Save clinical note"}
        </Button>
      </form>
    </Form>
  );
}
