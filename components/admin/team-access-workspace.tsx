import { AddPracticeMemberForm } from "@/components/team/add-practice-member-form";
import { CreateLocationForm } from "@/components/team/create-location-form";
import { PracticeMemberCard } from "@/components/team/practice-member-card";
import type { TeamLocation, TeamMember } from "@/components/team/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { formatEnumLabel } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type TeamProfile = Pick<
  Tables<"profiles">,
  "display_name" | "email" | "first_name" | "id" | "last_name"
>;

const roleOrder: Record<Tables<"practice_memberships">["role"], number> = {
  biller: 6,
  front_desk: 5,
  medical_assistant: 4,
  nurse: 3,
  practice_admin: 1,
  practice_owner: 0,
  provider: 2,
};

function getProfileDisplayName(profile: TeamProfile | null) {
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

  return profile?.email ?? "Practice member";
}

export async function TeamAccessWorkspace() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const canManage =
    context.membership.role === "practice_owner" ||
    context.membership.role === "practice_admin";
  const practiceId = context.practice.id;

  if (!canManage) {
    return (
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
            Admin
          </p>
          <h2 className="text-3xl font-semibold text-white">Practice admin workspace</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Practice owners and admins manage staff roles and location access
            here. Your current role is {formatEnumLabel(context.membership.role)}.
          </p>
        </div>
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Access required</CardTitle>
            <CardDescription className="text-slate-400">
              This page is limited to practice setup roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Ask a practice owner or admin if your access needs to change.</p>
            <p>
              Your operational workflows will continue to use the location
              assignments provisioned for your membership.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const [
    { data: memberships, error: membershipsError },
    { data: locations, error: locationsError },
    { data: assignmentRows, error: assignmentError },
  ] = await Promise.all([
    supabase
      .from("practice_memberships")
      .select(
        "user_id, role, specialties, employment_title, is_active, created_at"
      )
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("locations")
      .select("id, name, code, city, state_region, is_active")
      .eq("practice_id", practiceId)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("practice_member_locations")
      .select("user_id, location_id")
      .eq("practice_id", practiceId),
  ]);

  if (membershipsError || locationsError || assignmentError) {
    throw new Error("Practice team data could not be loaded.");
  }

  const userIds = memberships.map((membership) => membership.user_id);
  let profiles: TeamProfile[] = [];

  if (userIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, display_name")
      .in("id", userIds);

    if (profilesError) {
      throw new Error("Practice member profiles could not be loaded.");
    }

    profiles = profileRows;
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const locationIdsByUserId = new Map<string, string[]>();

  for (const assignment of assignmentRows) {
    const existingLocationIds = locationIdsByUserId.get(assignment.user_id) ?? [];
    existingLocationIds.push(assignment.location_id);
    locationIdsByUserId.set(assignment.user_id, existingLocationIds);
  }

  const teamLocations: TeamLocation[] = locations.map((location) => ({
    city: location.city,
    code: location.code,
    id: location.id,
    isActive: location.is_active,
    name: location.name,
    stateRegion: location.state_region,
  }));
  const teamMembers: TeamMember[] = memberships
    .map((membership) => {
      const profile = profileById.get(membership.user_id) ?? null;

      return {
        createdAt: membership.created_at,
        displayName: getProfileDisplayName(profile),
        email: profile?.email ?? null,
        employmentTitle: membership.employment_title,
        isActive: membership.is_active,
        locationIds: locationIdsByUserId.get(membership.user_id) ?? [],
        role: membership.role,
        specialties:
          membership.specialties.length > 0
            ? membership.specialties
            : context.practice.specialties,
        userId: membership.user_id,
      };
    })
    .sort((leftMember, rightMember) => {
      const roleDifference =
        roleOrder[leftMember.role] - roleOrder[rightMember.role];

      if (roleDifference !== 0) {
        return roleDifference;
      }

      return leftMember.createdAt.localeCompare(rightMember.createdAt);
    });
  const activeLocationCount = teamLocations.filter((location) => location.isActive).length;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Admin
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              Staff access and practice operations
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Manage which staff belong to {context.practice.name}, what role they
              hold, and which practice locations they can access in scheduling and
              operational workflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{teamMembers.length} team members</Badge>
            <Badge variant="outline">{activeLocationCount} active locations</Badge>
            <Badge variant="secondary">Admin controls enabled</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Current practice role
            </CardDescription>
            <CardTitle>{formatEnumLabel(context.membership.role)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            You can create locations, add staff, and update membership access.
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Practice specialty baseline
            </CardDescription>
            <CardTitle>Specialty coverage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {context.practice.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {formatEnumLabel(specialty)}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Access model
            </CardDescription>
            <CardTitle>Location-aware foundation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Non-admin staff are scoped to explicit locations. Practice owners and
            admins keep tenant-wide access for setup and operational oversight.
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
            <CardHeader>
              <CardTitle>Practice roster</CardTitle>
              <CardDescription className="text-slate-400">
                Roles, specialties, membership status, and location access by user.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <PracticeMemberCard
                canManage={canManage}
                key={member.userId}
                locations={teamLocations}
                member={member}
              />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
            <CardHeader>
              <CardTitle>Add team member</CardTitle>
              <CardDescription className="text-slate-400">
                Grant an existing signed-up user access to this practice and assign
                their initial role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddPracticeMemberForm locations={teamLocations} />
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
            <CardHeader>
              <CardTitle>Add location</CardTitle>
              <CardDescription className="text-slate-400">
                Locations become the access boundaries for non-admin staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateLocationForm />
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
            <CardHeader>
              <CardTitle>Current locations</CardTitle>
              <CardDescription className="text-slate-400">
                Review the practice locations available for assignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamLocations.length > 0 ? (
                teamLocations.map((location) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    key={location.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{location.name}</p>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          {location.code}
                        </p>
                      </div>
                      <Badge variant={location.isActive ? "secondary" : "outline"}>
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {[location.city, location.stateRegion].filter(Boolean).length > 0 ? (
                      <p className="mt-2 text-sm text-slate-400">
                        {[location.city, location.stateRegion]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  No locations exist yet. Add your first clinic or office to start
                  assigning staff access.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
