import type { Route } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const context = await getCurrentUserPracticeContext();

  if (!context.user) {
    redirect("/login" as Route);
  }

  if (context.practice && context.membership) {
    redirect("/dashboard" as Route);
  }

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("portal_user_id", context.user.id)
    .limit(1)
    .maybeSingle();

  redirect((patient ? "/portal" : "/onboarding") as Route);
}
