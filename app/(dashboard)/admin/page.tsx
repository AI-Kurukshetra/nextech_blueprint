import type { Metadata } from "next";
import { TeamAccessWorkspace } from "@/components/admin/team-access-workspace";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage practice members, staff roles, and location access.",
};

export default function AdminPage() {
  return <TeamAccessWorkspace />;
}
