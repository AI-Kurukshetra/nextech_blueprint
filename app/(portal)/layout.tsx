import type { Metadata } from "next";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: {
    default: "Patient Portal",
    template: "%s | Patient Portal",
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_34%),linear-gradient(180deg,_#082f49_0%,_#0f172a_100%)] text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/15 bg-slate-950/45 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
              Mahakurukshetra
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">Patient portal</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
