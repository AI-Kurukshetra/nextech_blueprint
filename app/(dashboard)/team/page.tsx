import type { Route } from "next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Team",
  description: "Legacy route that redirects to the admin workspace.",
};

export default function TeamPage() {
  redirect("/admin" as Route);
}
