"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createLocationSchema,
  createPracticeMemberSchema,
  normalizeLocationCode,
  updatePracticeMemberSchema,
  type CreateLocationInput,
  type CreatePracticeMemberInput,
  type ManageableStaffRole,
  type UpdatePracticeMemberInput,
} from "@/lib/validations";
import type { Tables, TablesInsert } from "@/types/supabase";

type ValidationErrors = Record<string, string[] | undefined>;
type AdminClient = ReturnType<typeof createAdminClient>;
type PracticeMembershipSnapshot = Pick<
  Tables<"practice_memberships">,
  "employment_title" | "is_active" | "role" | "specialties"
>;

export type TeamActionState = {
  fieldErrors?: ValidationErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

function getValidationState(error: ZodError): TeamActionState {
  return {
    fieldErrors: error.flatten().fieldErrors,
    message: "Review the highlighted fields and try again.",
    status: "error",
  };
}

function isPracticeAdminRole(role: string) {
  return role === "practice_owner" || role === "practice_admin";
}

function getLocationErrorMessage(error: { code?: string; message: string }) {
  if (
    error.code === "23505" ||
    error.message.toLowerCase().includes("locations_practice_code_unique")
  ) {
    return "That location code is already in use for this practice.";
  }

  return "The location could not be saved. Try again.";
}

function getPracticeMemberErrorMessage(error: {
  code?: string;
  message: string;
}) {
  if (
    error.code === "23505" ||
    error.message.toLowerCase().includes("practice_memberships_practice_user_unique")
  ) {
    return "That user is already a member of this practice.";
  }

  return "The team member could not be saved. Try again.";
}

function getCreatePracticeMemberLocationErrorMessage(didRollbackSucceed: boolean) {
  if (didRollbackSucceed) {
    return "The team member could not be assigned to the selected locations, so the membership was rolled back.";
  }

  return "The team member could not be assigned to the selected locations, and the new membership may need manual cleanup.";
}

function getRestorePracticeMemberErrorMessage(didRestoreSucceed: boolean) {
  if (didRestoreSucceed) {
    return "The new team settings could not be saved. The previous membership access was restored.";
  }

  return "The new team settings could not be saved, and the prior membership state could not be fully restored. Review this member manually.";
}

function getAdminClientOrError() {
  try {
    return {
      client: createAdminClient(),
      error: null,
    };
  } catch {
    return {
      client: null,
      error: "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
    };
  }
}

async function getPracticeAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { data: membership } = await supabase
    .from("practice_memberships")
    .select("practice_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding" as Route);
  }

  return {
    canManage: isPracticeAdminRole(membership.role),
    practiceId: membership.practice_id,
    role: membership.role,
    userId: user.id,
  };
}

async function getPracticeLocationState(
  adminClient: AdminClient,
  practiceId: string
) {
  const { data: locations, error } = await adminClient
    .from("locations")
    .select("id, is_active")
    .eq("practice_id", practiceId);

  if (error) {
    return {
      activeLocationCount: 0,
      error: "Practice locations could not be loaded.",
      locationIds: new Set<string>(),
    };
  }

  return {
    activeLocationCount: locations.filter((location) => location.is_active).length,
    error: null,
    locationIds: new Set(locations.map((location) => location.id)),
  };
}

async function getPracticeMemberLocationIds(
  adminClient: AdminClient,
  practiceId: string,
  userId: string
) {
  const { data: assignments, error } = await adminClient
    .from("practice_member_locations")
    .select("location_id")
    .eq("practice_id", practiceId)
    .eq("user_id", userId);

  if (error) {
    return {
      error: "Existing location assignments could not be loaded.",
      locationIds: [] as string[],
    };
  }

  return {
    error: null,
    locationIds: assignments.map((assignment) => assignment.location_id),
  };
}

async function replacePracticeMemberLocations(
  adminClient: AdminClient,
  assignment: {
    assignedByUserId: string;
    locationIds: string[];
    practiceId: string;
    userId: string;
  }
) {
  const { error: deleteError } = await adminClient
    .from("practice_member_locations")
    .delete()
    .eq("practice_id", assignment.practiceId)
    .eq("user_id", assignment.userId);

  if (deleteError) {
    return "Existing location assignments could not be updated.";
  }

  if (assignment.locationIds.length === 0) {
    return null;
  }

  const { error: insertError } = await adminClient
    .from("practice_member_locations")
    .insert(
      assignment.locationIds.map((locationId) => ({
        assigned_by_user_id: assignment.assignedByUserId,
        location_id: locationId,
        practice_id: assignment.practiceId,
        user_id: assignment.userId,
      }))
    );

  return insertError
    ? "The new location assignments could not be saved."
    : null;
}

async function deletePracticeMembership(
  adminClient: AdminClient,
  practiceId: string,
  userId: string
) {
  const { error } = await adminClient
    .from("practice_memberships")
    .delete()
    .eq("practice_id", practiceId)
    .eq("user_id", userId);

  return !error;
}

async function restorePracticeMembershipState(
  adminClient: AdminClient,
  assignment: {
    assignedByUserId: string;
    locationIds: string[];
    practiceId: string;
    userId: string;
  },
  snapshot: PracticeMembershipSnapshot
) {
  const { error: restoreMembershipError } = await adminClient
    .from("practice_memberships")
    .update({
      employment_title: snapshot.employment_title,
      is_active: snapshot.is_active,
      role: snapshot.role,
      specialties: snapshot.specialties,
    })
    .eq("practice_id", assignment.practiceId)
    .eq("user_id", assignment.userId);

  if (restoreMembershipError) {
    return false;
  }

  const restoreLocationError = await replacePracticeMemberLocations(
    adminClient,
    assignment
  );

  return restoreLocationError === null;
}

async function validateScopedRoleAssignments(
  adminClient: AdminClient,
  access: {
    isActive: boolean;
    locationIds: string[];
    practiceId: string;
    role: ManageableStaffRole;
  }
) {
  const practiceLocationState = await getPracticeLocationState(
    adminClient,
    access.practiceId
  );

  if (practiceLocationState.error) {
    return practiceLocationState.error;
  }

  for (const locationId of access.locationIds) {
    if (!practiceLocationState.locationIds.has(locationId)) {
      return "One or more selected locations do not belong to this practice.";
    }
  }

  if (
    access.isActive &&
    !isPracticeAdminRole(access.role) &&
    practiceLocationState.activeLocationCount > 0 &&
    access.locationIds.length === 0
  ) {
    return "Select at least one active location for non-admin staff.";
  }

  return null;
}

function revalidateTeamPaths() {
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/team");
}

export async function createLocationAction(
  _previousState: TeamActionState,
  payload: CreateLocationInput
): Promise<TeamActionState> {
  const parsedPayload = createLocationSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await getPracticeAdminContext();

  if (!context.canManage) {
    return {
      message: "Only practice owners and admins can manage locations.",
      status: "error",
    };
  }

  const adminClientState = getAdminClientOrError();

  if (adminClientState.error || !adminClientState.client) {
    return {
      message: adminClientState.error ?? "The admin client is unavailable.",
      status: "error",
    };
  }

  const {
    addressLine1,
    city,
    code,
    email,
    name,
    phone,
    stateRegion,
  } = parsedPayload.data;
  const locationInsert: TablesInsert<"locations"> = {
    address_line_1: addressLine1 || null,
    city: city || null,
    code: normalizeLocationCode(code || name),
    email: email || null,
    name,
    phone: phone || null,
    practice_id: context.practiceId,
    state_region: stateRegion || null,
  };
  const { error } = await adminClientState.client
    .from("locations")
    .insert(locationInsert);

  if (error) {
    return {
      message: getLocationErrorMessage(error),
      status: "error",
    };
  }

  revalidateTeamPaths();

  return {
    message: "Location created.",
    status: "success",
  };
}

export async function createPracticeMemberAction(
  _previousState: TeamActionState,
  payload: CreatePracticeMemberInput
): Promise<TeamActionState> {
  const parsedPayload = createPracticeMemberSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await getPracticeAdminContext();

  if (!context.canManage) {
    return {
      message: "Only practice owners and admins can manage team members.",
      status: "error",
    };
  }

  const adminClientState = getAdminClientOrError();

  if (adminClientState.error || !adminClientState.client) {
    return {
      message: adminClientState.error ?? "The admin client is unavailable.",
      status: "error",
    };
  }

  const assignmentError = await validateScopedRoleAssignments(
    adminClientState.client,
    {
      isActive: true,
      locationIds: parsedPayload.data.locationIds,
      practiceId: context.practiceId,
      role: parsedPayload.data.role,
    }
  );

  if (assignmentError) {
    return {
      message: assignmentError,
      status: "error",
    };
  }

  const normalizedEmail = parsedPayload.data.email.trim().toLowerCase();
  const { data: profile, error: profileError } = await adminClientState.client
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profileError) {
    return {
      message: "The staff account lookup failed. Try again.",
      status: "error",
    };
  }

  if (!profile) {
    return {
      message:
        "No registered account exists for that email yet. Ask the user to sign up first, then add them here.",
      status: "error",
    };
  }

  const membershipInsert: TablesInsert<"practice_memberships"> = {
    employment_title: parsedPayload.data.employmentTitle || null,
    invited_by_user_id: context.userId,
    is_active: true,
    practice_id: context.practiceId,
    role: parsedPayload.data.role,
    specialties: parsedPayload.data.specialties,
    user_id: profile.id,
  };
  const { error: membershipError } = await adminClientState.client
    .from("practice_memberships")
    .insert(membershipInsert);

  if (membershipError) {
    return {
      message: getPracticeMemberErrorMessage(membershipError),
      status: "error",
    };
  }

  if (!isPracticeAdminRole(parsedPayload.data.role)) {
    const locationReplaceError = await replacePracticeMemberLocations(
      adminClientState.client,
      {
        assignedByUserId: context.userId,
        locationIds: parsedPayload.data.locationIds,
        practiceId: context.practiceId,
        userId: profile.id,
      }
    );

    if (locationReplaceError) {
      const didRollbackSucceed = await deletePracticeMembership(
        adminClientState.client,
        context.practiceId,
        profile.id
      );

      return {
        message: getCreatePracticeMemberLocationErrorMessage(
          didRollbackSucceed
        ),
        status: "error",
      };
    }
  }

  revalidateTeamPaths();

  return {
    message: "Team member added.",
    status: "success",
  };
}

export async function updatePracticeMemberAction(
  _previousState: TeamActionState,
  payload: UpdatePracticeMemberInput
): Promise<TeamActionState> {
  const parsedPayload = updatePracticeMemberSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return getValidationState(parsedPayload.error);
  }

  const context = await getPracticeAdminContext();

  if (!context.canManage) {
    return {
      message: "Only practice owners and admins can manage team members.",
      status: "error",
    };
  }

  const adminClientState = getAdminClientOrError();

  if (adminClientState.error || !adminClientState.client) {
    return {
      message: adminClientState.error ?? "The admin client is unavailable.",
      status: "error",
    };
  }

  const { data: existingMembership, error: membershipLookupError } =
    await adminClientState.client
      .from("practice_memberships")
      .select("employment_title, is_active, role, specialties")
      .eq("practice_id", context.practiceId)
      .eq("user_id", parsedPayload.data.userId)
      .maybeSingle();

  if (membershipLookupError || !existingMembership) {
    return {
      message: "That team member could not be found in this practice.",
      status: "error",
    };
  }

  if (existingMembership.role === "practice_owner") {
    return {
      message: "The practice owner membership cannot be reassigned or deactivated.",
      status: "error",
    };
  }

  const existingLocationState = await getPracticeMemberLocationIds(
    adminClientState.client,
    context.practiceId,
    parsedPayload.data.userId
  );

  if (existingLocationState.error) {
    return {
      message: existingLocationState.error,
      status: "error",
    };
  }

  const assignmentError = await validateScopedRoleAssignments(
    adminClientState.client,
    {
      isActive: parsedPayload.data.isActive,
      locationIds: parsedPayload.data.locationIds,
      practiceId: context.practiceId,
      role: parsedPayload.data.role,
    }
  );

  if (assignmentError) {
    return {
      message: assignmentError,
      status: "error",
    };
  }

  const { error: updateError } = await adminClientState.client
    .from("practice_memberships")
    .update({
      employment_title: parsedPayload.data.employmentTitle || null,
      is_active: parsedPayload.data.isActive,
      role: parsedPayload.data.role,
      specialties: parsedPayload.data.specialties,
    })
    .eq("practice_id", context.practiceId)
    .eq("user_id", parsedPayload.data.userId);

  if (updateError) {
    return {
      message: getPracticeMemberErrorMessage(updateError),
      status: "error",
    };
  }

  const nextLocationIds =
    parsedPayload.data.isActive && !isPracticeAdminRole(parsedPayload.data.role)
      ? parsedPayload.data.locationIds
      : [];
  const locationReplaceError = await replacePracticeMemberLocations(
    adminClientState.client,
    {
      assignedByUserId: context.userId,
      locationIds: nextLocationIds,
      practiceId: context.practiceId,
      userId: parsedPayload.data.userId,
    }
  );

  if (locationReplaceError) {
    const didRestoreSucceed = await restorePracticeMembershipState(
      adminClientState.client,
      {
        assignedByUserId: context.userId,
        locationIds: existingLocationState.locationIds,
        practiceId: context.practiceId,
        userId: parsedPayload.data.userId,
      },
      existingMembership
    );

    return {
      message: getRestorePracticeMemberErrorMessage(didRestoreSucceed),
      status: "error",
    };
  }

  revalidateTeamPaths();

  return {
    message: "Team member updated.",
    status: "success",
  };
}
