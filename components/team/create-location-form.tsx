"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createLocationAction,
  type TeamActionState,
} from "@/app/actions/team";
import { FormStatus } from "@/components/auth/form-status";
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
  createLocationSchema,
  type CreateLocationFormValues,
  type CreateLocationInput,
} from "@/lib/validations";

function applyFieldErrors(
  actionState: TeamActionState,
  setError: UseFormSetError<CreateLocationFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof CreateLocationFormValues, {
      message,
      type: "server",
    });
  }
}

const defaultValues: CreateLocationFormValues = {
  addressLine1: "",
  city: "",
  code: "",
  email: "",
  name: "",
  phone: "",
  stateRegion: "",
};
const initialTeamActionState: TeamActionState = { status: "idle" };

export function CreateLocationForm() {
  const [actionState, submitAction, isPending] = useActionState(
    createLocationAction,
    initialTeamActionState
  );
  const router = useRouter();
  const form = useForm<CreateLocationFormValues, undefined, CreateLocationInput>({
    defaultValues,
    resolver: zodResolver(createLocationSchema),
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
        <FormField<CreateLocationFormValues>
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location name</FormLabel>
              <FormControl>
                <Input placeholder="Downtown dermatology suite" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField<CreateLocationFormValues>
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location code</FormLabel>
              <FormControl>
                <Input placeholder="DT-01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateLocationFormValues>
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="downtown@mahakurukshetra.com"
                    type="email"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateLocationFormValues>
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 555 014 2244"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField<CreateLocationFormValues>
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address line 1</FormLabel>
              <FormControl>
                <Input
                  placeholder="245 West 34th Street"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField<CreateLocationFormValues>
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="New York" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField<CreateLocationFormValues>
            control={form.control}
            name="stateRegion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / region</FormLabel>
                <FormControl>
                  <Input placeholder="NY" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Saving location..." : "Add location"}
        </Button>
      </form>
    </Form>
  );
}
