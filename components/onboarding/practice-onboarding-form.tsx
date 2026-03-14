"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import {
  createPracticeAction,
  type ActionState,
} from "@/app/actions/auth";
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
  type PracticeOnboardingFormValues,
  practiceOnboardingSchema,
  type PracticeOnboardingInput,
} from "@/lib/validations";

const DEFAULT_TIMEZONE = "UTC";
const initialActionState: ActionState = { status: "idle" };

function applyFieldErrors(
  actionState: ActionState,
  setError: UseFormSetError<PracticeOnboardingFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof PracticeOnboardingFormValues, {
      message,
      type: "server",
    });
  }
}

export function PracticeOnboardingForm() {
  const [actionState, submitAction, isPending] = useActionState(
    createPracticeAction,
    initialActionState
  );
  const form = useForm<
    PracticeOnboardingFormValues,
    undefined,
    PracticeOnboardingInput
  >({
    defaultValues: {
      practiceName: "",
      practiceSlug: "",
      primaryEmail: "",
      primaryPhone: "",
      timezone: DEFAULT_TIMEZONE,
    },
    resolver: zodResolver(practiceOnboardingSchema),
  });

  useEffect(() => {
    applyFieldErrors(actionState, form.setError);
  }, [actionState, form]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    startTransition(() => {
      submitAction(values);
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={submit}>
        <FormStatus message={actionState.message} />
        <FormField<PracticeOnboardingFormValues>
          control={form.control}
          name="practiceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Practice name</FormLabel>
              <FormControl>
                <Input placeholder="Mahakurukshetra Dermatology" {...field} />
              </FormControl>
              <FormDescription>
                This is the staff-facing name shown across the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField<PracticeOnboardingFormValues>
          control={form.control}
          name="practiceSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Practice slug</FormLabel>
              <FormControl>
                <Input placeholder="mahakurukshetra-dermatology" {...field} />
              </FormControl>
              <FormDescription>
                Leave this blank to generate a slug from the practice name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<PracticeOnboardingFormValues>
            control={form.control}
            name="primaryEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Practice email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="frontdesk@mahakurukshetra.com"
                    type="email"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<PracticeOnboardingFormValues>
            control={form.control}
            name="primaryPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Practice phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 555 014 2233"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField<PracticeOnboardingFormValues>
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input placeholder="UTC" {...field} />
              </FormControl>
              <FormDescription>
                Use an IANA timezone such as `America/New_York` or `UTC`.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Creating practice..." : "Create practice"}
        </Button>
      </form>
    </Form>
  );
}
