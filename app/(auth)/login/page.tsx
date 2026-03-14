import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to access Mahakurukshetra.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

function getNotice(error?: string, message?: string) {
  if (error === "auth_callback_failed") {
    return {
      message: "Authentication callback failed. Try signing in again.",
      tone: "error" as const,
    };
  }

  if (message === "check_email") {
    return {
      message: "Check your email to confirm the account and continue setup.",
      tone: "success" as const,
    };
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const notice = getNotice(params.error, params.message);
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/dashboard";

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          Return to your practice
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">Sign in</h1>
        <p className="text-sm text-slate-600">
          Access scheduling, charting, billing, and patient records from one
          place.
        </p>
      </div>
      <LoginForm nextPath={nextPath} notice={notice} />
    </section>
  );
}
