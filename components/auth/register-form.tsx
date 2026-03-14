"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  signUpAction,
  type ActionState,
} from "@/app/actions/auth";
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
import { signUpSchema, type SignUpInput } from "@/lib/validations";

type RegisterFormProps = {
  notice?: {
    message: string;
    tone: "error" | "success";
  };
};

const initialActionState: ActionState = { status: "idle" };

function applyFieldErrors(
  actionState: ActionState,
  setError: ReturnType<typeof useForm<SignUpInput>>["setError"]
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof SignUpInput, {
      message,
      type: "server",
    });
  }
}

export function RegisterForm({ notice }: RegisterFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    signUpAction,
    initialActionState
  );
  const form = useForm<SignUpInput>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
    resolver: zodResolver(signUpSchema),
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
        <FormStatus
          message={notice?.message}
          tone={notice?.tone}
        />
        <FormStatus
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="given-name"
                    placeholder="Aarav"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="family-name"
                    placeholder="Sharma"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  autoComplete="email"
                  placeholder="doctor@mahakurukshetra.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-medium text-slate-900 underline" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
