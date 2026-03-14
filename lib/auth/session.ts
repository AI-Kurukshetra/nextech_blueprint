import "server-only";

import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

export type ProfileSummary = Pick<
  Tables<"profiles">,
  "display_name" | "email" | "first_name" | "id" | "last_name"
>;

export type PracticeMembershipSummary = Pick<
  Tables<"practice_memberships">,
  "created_at" | "employment_title" | "practice_id" | "role" | "specialties"
>;

export type PracticeSummary = Pick<
  Tables<"practices">,
  | "created_at"
  | "id"
  | "is_active"
  | "name"
  | "primary_email"
  | "primary_phone"
  | "slug"
  | "specialties"
  | "timezone"
>;

export type UserPracticeContext = {
  membership: PracticeMembershipSummary | null;
  practice: PracticeSummary | null;
  profile: ProfileSummary | null;
  user: User | null;
};

export type RequiredUserPracticeContext = Omit<
  UserPracticeContext,
  "membership" | "practice" | "user"
> & {
  membership: PracticeMembershipSummary;
  practice: PracticeSummary;
  user: User;
};

export const getCurrentUserPracticeContext = cache(
  async (): Promise<UserPracticeContext> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        membership: null,
        practice: null,
        profile: null,
        user: null,
      };
    }

    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, first_name, last_name, display_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("practice_memberships")
        .select("practice_id, role, specialties, employment_title, created_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!membership) {
      return {
        membership: null,
        practice: null,
        profile,
        user,
      };
    }

    const { data: practice } = await supabase
      .from("practices")
      .select(
        "id, name, slug, specialties, timezone, is_active, primary_email, primary_phone, created_at"
      )
      .eq("id", membership.practice_id)
      .maybeSingle();

    return {
      membership,
      practice,
      profile,
      user,
    };
  }
);

export function getUserDisplayName(context: UserPracticeContext) {
  const profile = context.profile;

  if (profile?.display_name) {
    return profile.display_name;
  }

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return context.user?.email ?? "Authenticated user";
}

export async function requireUserPracticeContext(): Promise<RequiredUserPracticeContext> {
  const context = await getCurrentUserPracticeContext();

  if (!context.user) {
    redirect("/login" as Route);
  }

  if (!context.membership || !context.practice) {
    redirect("/onboarding" as Route);
  }

  return {
    membership: context.membership,
    practice: context.practice,
    profile: context.profile,
    user: context.user,
  };
}
