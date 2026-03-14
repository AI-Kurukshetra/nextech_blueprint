import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account to start using Mahakurukshetra.",
};

export default function RegisterPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          Get started
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">Register</h1>
        <p className="text-sm text-slate-600">
          Create your owner account, confirm the email if required, then finish
          practice setup.
        </p>
      </div>
      <RegisterForm />
    </section>
  );
}
