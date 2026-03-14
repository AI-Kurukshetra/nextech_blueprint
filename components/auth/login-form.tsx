"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import {
  initialActionState,
  signInAction,
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
import {
  signInSchema,
  type SignInFormValues,
  type SignInInput,
} from "@/lib/validations";

type LoginFormProps = {
  nextPath: string;
  notice?: {
    message: string;
    tone: "error" | "success";
  };
};

function applyFieldErrors(
  actionState: ActionState,
  setError: UseFormSetError<SignInFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof SignInFormValues, {
      message,
      type: "server",
    });
  }
}

export function LoginForm({ nextPath, notice }: LoginFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    signInAction,
    initialActionState
  );
  const form = useForm<SignInFormValues, undefined, SignInInput>({
    defaultValues: {
      email: "",
      next: nextPath,
      password: "",
    },
    resolver: zodResolver(signInSchema),
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
        <FormStatus message={actionState.message} />
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-slate-500">
          New here?{" "}
          <Link className="font-medium text-slate-900 underline" href="/register">
            Create an account
          </Link>
        </p>
      </form>
    </Form>
  );
}
