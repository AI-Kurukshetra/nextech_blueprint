"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createAppointmentAction,
  initialAppointmentActionState,
  type AppointmentActionState,
} from "@/app/actions/appointments";
import type {
  AppointmentLocationOption,
  AppointmentPatientOption,
  AppointmentProviderOption,
} from "@/components/appointments/types";
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
  appointmentTypeOptions,
  createAppointmentFormSchema,
  formatEnumLabel,
  normalizeAppointmentSubmission,
  type CreateAppointmentFormOutput,
  type CreateAppointmentFormValues,
} from "@/lib/validations";

type CreateAppointmentFormProps = {
  locations: AppointmentLocationOption[];
  patients: AppointmentPatientOption[];
  practiceTimezone: string;
  providers: AppointmentProviderOption[];
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
const textareaClassName =
  "flex min-h-28 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

function toDateTimeLocalValue(value: Date) {
  const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return localValue.toISOString().slice(0, 16);
}

function getDefaultValues(): CreateAppointmentFormValues {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);

  if (start.getTime() <= Date.now()) {
    start.setMinutes(start.getMinutes() + 30);
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return {
    appointmentType: "follow_up",
    endsAtLocal: toDateTimeLocalValue(end),
    locationId: "",
    notes: "",
    patientId: "",
    providerUserId: "",
    roomLabel: "",
    startsAtLocal: toDateTimeLocalValue(start),
    visitReason: "",
  };
}

function applyFieldErrors(
  actionState: AppointmentActionState,
  setError: UseFormSetError<CreateAppointmentFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  const fieldNameMap: Partial<
    Record<string, keyof CreateAppointmentFormValues>
  > = {
    endsAt: "endsAtLocal",
    startsAt: "startsAtLocal",
  };

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError((fieldNameMap[fieldName] ?? fieldName) as keyof CreateAppointmentFormValues, {
      message,
      type: "server",
    });
  }
}

function getPatientLabel(patient: AppointmentPatientOption) {
  return `${patient.displayName} - ${patient.chartNumber}`;
}

function getLocationLabel(location: AppointmentLocationOption) {
  const locationSummary = [location.city, location.stateRegion]
    .filter(Boolean)
    .join(", ");

  return locationSummary
    ? `${location.name} (${location.code}) - ${locationSummary}`
    : `${location.name} (${location.code})`;
}

function getProviderLabel(provider: AppointmentProviderOption) {
  return `${provider.displayName} - ${formatEnumLabel(provider.role)}`;
}

export function CreateAppointmentForm({
  locations,
  patients,
  practiceTimezone,
  providers,
}: CreateAppointmentFormProps) {
  const defaultValues = getDefaultValues();
  const [actionState, submitAction, isPending] = useActionState(
    createAppointmentAction,
    initialAppointmentActionState
  );
  const router = useRouter();
  const form = useForm<
    CreateAppointmentFormValues,
    undefined,
    CreateAppointmentFormOutput
  >({
    defaultValues,
    resolver: zodResolver(createAppointmentFormSchema),
  });
  const selectedLocationId = form.watch("locationId");
  const selectedProviderUserId = form.watch("providerUserId");
  const activeLocations = locations.filter((location) => location.isActive);
  const availableProviders = providers.filter(
    (provider) =>
      !selectedLocationId ||
      provider.role === "practice_owner" ||
      provider.locationIds.includes(selectedLocationId)
  );
  const hasSchedulingPrerequisites =
    activeLocations.length > 0 && patients.length > 0 && providers.length > 0;

  useEffect(() => {
    applyFieldErrors(actionState, form.setError);
  }, [actionState, form]);

  useEffect(() => {
    if (!selectedProviderUserId) {
      return;
    }

    const providerStillAvailable = providers.some(
      (provider) =>
        provider.userId === selectedProviderUserId &&
        (!selectedLocationId ||
          provider.role === "practice_owner" ||
          provider.locationIds.includes(selectedLocationId))
    );

    if (!providerStillAvailable) {
      form.setValue("providerUserId", "");
    }
  }, [form, providers, selectedLocationId, selectedProviderUserId]);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    form.reset(getDefaultValues());
    router.refresh();
  }, [actionState.status, form, router]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    startTransition(() => {
      submitAction(normalizeAppointmentSubmission(values));
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={submit}>
        <FormStatus
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
        {!hasSchedulingPrerequisites ? (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300">
            Scheduling needs at least one active patient, one active location, and
            one schedulable provider. Use the patients and admin workspaces to
            finish setup before creating appointments.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasSchedulingPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={field.value}
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
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasSchedulingPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={field.value}
                  >
                    <option className="bg-slate-950 text-white" value="">
                      Select a location
                    </option>
                    {activeLocations.map((location) => (
                      <option
                        className="bg-slate-950 text-white"
                        key={location.id}
                        value={location.id}
                      >
                        {getLocationLabel(location)}
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
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="providerUserId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasSchedulingPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={field.value}
                  >
                    <option className="bg-slate-950 text-white" value="">
                      {selectedLocationId
                        ? "Select a provider for this location"
                        : "Select a provider"}
                    </option>
                    {availableProviders.map((provider) => (
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
                <FormDescription>
                  Providers are filtered by the selected location when assignment
                  data exists.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="appointmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment type</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={!hasSchedulingPrerequisites}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={field.value}
                  >
                    {appointmentTypeOptions.map((option) => (
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
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="startsAtLocal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start</FormLabel>
                <FormControl>
                  <Input disabled={!hasSchedulingPrerequisites} type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>Saved in the practice timezone: {practiceTimezone}.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="endsAtLocal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End</FormLabel>
                <FormControl>
                  <Input disabled={!hasSchedulingPrerequisites} type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="visitReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visit reason</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasSchedulingPrerequisites}
                    placeholder="Annual skin exam"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateAppointmentFormValues>
            control={form.control}
            name="roomLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room label</FormLabel>
                <FormControl>
                  <Input
                    disabled={!hasSchedulingPrerequisites}
                    placeholder="Room 3"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField<CreateAppointmentFormValues>
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduling notes</FormLabel>
              <FormControl>
                <textarea
                  className={textareaClassName}
                  disabled={!hasSchedulingPrerequisites}
                  placeholder="Arrive 15 minutes early for paperwork."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="w-full"
          disabled={isPending || !hasSchedulingPrerequisites}
          type="submit"
        >
          {isPending ? "Scheduling..." : "Create appointment"}
        </Button>
      </form>
    </Form>
  );
}
