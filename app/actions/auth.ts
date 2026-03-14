"use server";

import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  normalizePracticeSlug,
  practiceOnboardingSchema,
  signInSchema,
  signUpSchema,
  type PracticeOnboardingInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations";

type ValidationErrors = Record<string, string[] | undefined>;

export type ActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialActionState: ActionState = {
  status: "idle",
};

function getValidationState(error: ZodError): ActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted fields and try again.",
    status: "error",
  };
}

function getSafeNextPath(rawPath: string | null | undefined) {
  if (!rawPath || !rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return "/dashboard";
  }

  return rawPath;
}

function getAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.toLowerCase().includes("email not confirmed")) {
    return "Check your email to confirm the account, then try again.";
  }

  return message;
}

function getPracticeInsertErrorMessage(error: {
  code?: string;
  message: string;
}) {
  if (
    error.code === "23505" ||
    error.message.toLowerCase().includes("practices_slug_unique_idx")
  ) {
    return "That practice slug is already taken. Choose a different one.";
  }

  return "Practice setup could not be completed. Try again.";
}

function getMetadataObject(user: User) {
  if (
    typeof user.user_metadata === "object" &&
    user.user_metadata !== null &&
    !Array.isArray(user.user_metadata)
  ) {
    return user.user_metadata as Record<string, unknown>;
  }

  return {};
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

async function ensureProfileRow(user: User) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return null;
  }

  const metadata = getMetadataObject(user);
  const firstName = getOptionalString(metadata.first_name);
  const lastName = getOptionalString(metadata.last_name);
  const joinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fullName =
    getOptionalString(metadata.full_name) ?? (joinedName || user.email || null);

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...metadata,
      ...(firstName ? { first_name: firstName } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
    },
  });

  if (updateError) {
    return updateError.message;
  }

  const { data: syncedProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return syncedProfile ? null : "Profile sync did not complete. Try again.";
}

export async function signInAction(
  _previousState: ActionState,
  payload: SignInInput
): Promise<ActionState> {
  const parsedPayload = signInSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const supabase = await createClient();
  const { email, next, password } = parsedPayload.data;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: getAuthErrorMessage(error.message),
      status: "error",
    };
  }

  const requestedPath = getSafeNextPath(next);
  let hasPracticeAccess = false;

  if (data.user) {
    const { data: membership } = await supabase
      .from("practice_memberships")
      .select("practice_id")
      .eq("user_id", data.user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    hasPracticeAccess = Boolean(membership);
  }

  if (!hasPracticeAccess) {
    redirect("/onboarding" as Route);
  }

  redirect((requestedPath === "/onboarding" ? "/dashboard" : requestedPath) as Route);
}

export async function signUpAction(
  _previousState: ActionState,
  payload: SignUpInput
): Promise<ActionState> {
  const parsedPayload = signUpSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return {
      message: "NEXT_PUBLIC_APP_URL is missing.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { email, firstName, lastName, password } = parsedPayload.data;
  const redirectTo = new URL("/auth/callback?next=/onboarding", appUrl).toString();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        full_name: `${firstName} ${lastName}`.trim(),
        last_name: lastName,
      },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return {
      message: getAuthErrorMessage(error.message),
      status: "error",
    };
  }

  if (data.session) {
    redirect("/onboarding" as Route);
  }

  return {
    message: "Check your email to confirm the account and continue setup.",
    status: "success",
  };
}

export async function createPracticeAction(
  _previousState: ActionState,
  payload: PracticeOnboardingInput
): Promise<ActionState> {
  const parsedPayload = practiceOnboardingSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const profileSyncError = await ensureProfileRow(user);

  if (profileSyncError) {
    return {
      message: profileSyncError,
      status: "error",
    };
  }

  const { data: membership } = await supabase
    .from("practice_memberships")
    .select("practice_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard" as Route);
  }

  const { practiceName, practiceSlug, primaryEmail, primaryPhone, timezone } =
    parsedPayload.data;
  const normalizedPracticeSlug = normalizePracticeSlug(
    practiceSlug || practiceName
  );
  const { error } = await supabase.from("practices").insert({
    name: practiceName,
    owner_user_id: user.id,
    primary_email: primaryEmail || null,
    primary_phone: primaryPhone || null,
    slug: normalizedPracticeSlug,
    specialties: ["dermatology"],
    timezone,
  });

  if (error) {
    return {
      message: getPracticeInsertErrorMessage(error),
      status: "error",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect("/dashboard" as Route);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login" as Route);
}
