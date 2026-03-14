"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createPracticeMemberAction,
  type TeamActionState,
} from "@/app/actions/team";
import { FormStatus } from "@/components/auth/form-status";
import { PracticeMemberFormFields } from "@/components/team/member-form-fields";
import type { TeamLocation } from "@/components/team/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createPracticeMemberSchema,
  type CreatePracticeMemberFormValues,
  type CreatePracticeMemberInput,
} from "@/lib/validations";

type AddPracticeMemberFormProps = {
  locations: TeamLocation[];
};

function applyFieldErrors(
  actionState: TeamActionState,
  setError: UseFormSetError<CreatePracticeMemberFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof CreatePracticeMemberFormValues, {
      message,
      type: "server",
    });
  }
}

const defaultValues: CreatePracticeMemberFormValues = {
  email: "",
  employmentTitle: "",
  locationIds: [],
  role: "provider",
  specialties: ["dermatology"],
};
const initialTeamActionState: TeamActionState = { status: "idle" };

export function AddPracticeMemberForm({
  locations,
}: AddPracticeMemberFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    createPracticeMemberAction,
    initialTeamActionState
  );
  const router = useRouter();
  const form = useForm<
    CreatePracticeMemberFormValues,
    undefined,
    CreatePracticeMemberInput
  >({
    defaultValues,
    resolver: zodResolver(createPracticeMemberSchema),
  });

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
      submitAction(values);
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={submit}>
        <FormStatus
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
        <FormField<CreatePracticeMemberFormValues>
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account email</FormLabel>
              <FormControl>
                <Input
                  placeholder="nurse@mahakurukshetra.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <p className="text-sm text-slate-400">
                Staff must already have a registered account before you can add them.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <PracticeMemberFormFields
          form={form}
          locationDescription="Non-admin staff only see the locations assigned here."
          locations={locations}
        />
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Adding team member..." : "Add team member"}
        </Button>
      </form>
    </Form>
  );
}
