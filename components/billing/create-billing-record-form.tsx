"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createBillingRecordAction,
  type BillingActionState,
} from "@/app/actions/billing";
import type {
  BillingAppointmentOption,
  BillingInsuranceOption,
  BillingPatientOption,
  BillingProviderOption,
} from "@/components/billing/types";
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
  billingStatusOptions,
  createBillingRecordFormSchema,
  formatEnumLabel,
  normalizeBillingRecordSubmission,
  type CreateBillingRecordFormOutput,
  type CreateBillingRecordFormValues,
} from "@/lib/validations";

type CreateBillingRecordFormProps = {
  appointments: BillingAppointmentOption[];
  insurances: BillingInsuranceOption[];
  patients: BillingPatientOption[];
  providers: BillingProviderOption[];
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

const defaultValues: CreateBillingRecordFormValues = {
  allowedAmount: 0,
  appointmentId: "",
  balanceAmount: 0,
  chargeAmount: 0,
  claimReference: "",
  cptCode: "",
  icd10CodesInput: "",
  insurancePolicyId: "",
  modifierCodesInput: "",
  notes: "",
  paidAt: "",
  patientId: "",
  renderingProviderUserId: "",
  serviceDate: getTodayDate(),
  status: "draft",
  submittedAt: "",
  units: 1,
};
const initialBillingActionState: BillingActionState = { status: "idle" };

function applyFieldErrors(
  actionState: BillingActionState,
  setError: UseFormSetError<CreateBillingRecordFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof CreateBillingRecordFormValues, {
      message,
      type: "server",
    });
  }
}

function getPatientLabel(patient: BillingPatientOption) {
  return `${patient.displayName} - ${patient.chartNumber}`;
}

function getAppointmentLabel(appointment: BillingAppointmentOption) {
  return `${appointment.label} - ${formatEnumLabel(appointment.status)}`;
}

function getInsuranceLabel(insurance: BillingInsuranceOption) {
  return `${insurance.payerName}${insurance.planName ? ` (${insurance.planName})` : ""} - ${
    insurance.memberId
  }${insurance.isPrimary ? " - Primary" : ""}`;
}

function getProviderLabel(provider: BillingProviderOption) {
  return `${provider.displayName} - ${formatEnumLabel(provider.role)}`;
}

export function CreateBillingRecordForm({
  appointments,
  insurances,
  patients,
  providers,
}: CreateBillingRecordFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    createBillingRecordAction,
    initialBillingActionState
  );
  const router = useRouter();
  const form = useForm<
    CreateBillingRecordFormValues,
    undefined,
    CreateBillingRecordFormOutput
  >({
    defaultValues,
    resolver: zodResolver(createBillingRecordFormSchema),
  });
  const selectedPatientId = form.watch("patientId");
  const filteredAppointments = useMemo(
    () =>
      selectedPatientId
        ? appointments.filter((appointment) => appointment.patientId === selectedPatientId)
        : appointments,
    [appointments, selectedPatientId]
  );
  const filteredInsurances = useMemo(
    () =>
      selectedPatientId
        ? insurances.filter((insurance) => insurance.patientId === selectedPatientId)
        : insurances,
    [insurances, selectedPatientId]
  );
  const hasPrerequisites = patients.length > 0;

  useEffect(() => {
    applyFieldErrors(actionState, form.setError);
  }, [actionState, form]);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    form.reset({
      ...defaultValues,
      serviceDate: getTodayDate(),
    });
    router.refresh();
  }, [actionState.status, form, router]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    startTransition(() => {
      submitAction(normalizeBillingRecordSubmission(values));
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
            Billing needs at least one active patient record.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateBillingRecordFormValues>
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
                      form.setValue("insurancePolicyId", "");
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
          <FormField<CreateBillingRecordFormValues>
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
                  Billing links only to completed visits.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="insurancePolicyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance policy (optional)</FormLabel>
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
                      Self-pay / no policy
                    </option>
                    {filteredInsurances.map((insurance) => (
                      <option
                        className="bg-slate-950 text-white"
                        key={insurance.id}
                        value={insurance.id}
                      >
                        {getInsuranceLabel(insurance)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="renderingProviderUserId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rendering provider (optional)</FormLabel>
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
                      No provider
                    </option>
                    {providers.map((provider) => (
                      <option
                        className="bg-slate-950 text-white"
                        key={provider.userId}
                        value={provider.userId}
                      >
                        {getProviderLabel(provider)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="serviceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service date</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    type="date"
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing status</FormLabel>
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
                    {billingStatusOptions.map((status) => (
                      <option className="bg-slate-950 text-white" key={status} value={status}>
                        {formatEnumLabel(status)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Units</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    min={1}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    ref={field.ref}
                    type="number"
                    value={Number(field.value ?? 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="cptCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPT code</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    placeholder="99213"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="claimReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Claim reference</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="CLM-2026-00102"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="chargeAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Charge amount</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    min={0}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    ref={field.ref}
                    step="0.01"
                    type="number"
                    value={Number(field.value ?? 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="allowedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allowed amount</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    min={0}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    ref={field.ref}
                    step="0.01"
                    type="number"
                    value={Number(field.value ?? 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="balanceAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Balance amount</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    min={0}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    ref={field.ref}
                    step="0.01"
                    type="number"
                    value={Number(field.value ?? 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="modifierCodesInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modifier codes</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    placeholder="25, 59"
                    ref={field.ref}
                    value={String(field.value ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="icd10CodesInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ICD-10 codes</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    placeholder="L70.0, L81.4"
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
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="submittedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submitted at (optional)</FormLabel>
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
          <FormField<CreateBillingRecordFormValues>
            control={form.control}
            name="paidAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid at (optional)</FormLabel>
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
        <FormField<CreateBillingRecordFormValues>
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing notes</FormLabel>
              <FormControl>
                <textarea
                  className={textareaClassName}
                  disabled={!hasPrerequisites}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  placeholder="Claim prepared after completed follow-up visit."
                  ref={field.ref}
                  value={String(field.value ?? "")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={isPending || !hasPrerequisites} type="submit">
          {isPending ? "Saving billing record..." : "Save billing record"}
        </Button>
      </form>
    </Form>
  );
}
