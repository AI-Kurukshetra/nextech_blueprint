"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  updatePracticeMemberAction,
  type TeamActionState,
} from "@/app/actions/team";
import { FormStatus } from "@/components/auth/form-status";
import { PracticeMemberFormFields } from "@/components/team/member-form-fields";
import type { TeamLocation, TeamMember } from "@/components/team/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  formatEnumLabel,
  updatePracticeMemberSchema,
  type ManageableStaffRole,
  type UpdatePracticeMemberFormValues,
  type UpdatePracticeMemberInput,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

type PracticeMemberCardProps = {
  canManage: boolean;
  locations: TeamLocation[];
  member: TeamMember;
};

const initialTeamActionState: TeamActionState = { status: "idle" };

function applyFieldErrors(
  actionState: TeamActionState,
  setError: UseFormSetError<UpdatePracticeMemberFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof UpdatePracticeMemberFormValues, {
      message,
      type: "server",
    });
  }
}

function getLocationSummary(member: TeamMember, locations: TeamLocation[]) {
  if (member.role === "practice_owner" || member.role === "practice_admin") {
    return "All locations";
  }

  const names = member.locationIds
    .map((locationId) => locations.find((location) => location.id === locationId)?.name)
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : "No locations assigned";
}

export function PracticeMemberCard({
  canManage,
  locations,
  member,
}: PracticeMemberCardProps) {
  const [actionState, submitAction, isPending] = useActionState(
    updatePracticeMemberAction,
    initialTeamActionState
  );
  const router = useRouter();
  const isOwner = member.role === "practice_owner";
  const isEditable = canManage && !isOwner;
  const form = useForm<
    UpdatePracticeMemberFormValues,
    undefined,
    UpdatePracticeMemberInput
  >({
    defaultValues: {
      employmentTitle: member.employmentTitle ?? "",
      isActive: member.isActive,
      locationIds: member.locationIds,
      role:
        member.role === "practice_owner"
          ? "practice_admin"
          : (member.role as ManageableStaffRole),
      specialties: member.specialties,
      userId: member.userId,
    },
    resolver: zodResolver(updatePracticeMemberSchema),
  });

  useEffect(() => {
    applyFieldErrors(actionState, form.setError);
  }, [actionState, form]);

  useEffect(() => {
    form.reset({
      employmentTitle: member.employmentTitle ?? "",
      isActive: member.isActive,
      locationIds: member.locationIds,
      role:
        member.role === "practice_owner"
          ? "practice_admin"
          : (member.role as ManageableStaffRole),
      specialties: member.specialties,
      userId: member.userId,
    });
  }, [form, member]);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    router.refresh();
  }, [actionState.status, router]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    startTransition(() => {
      submitAction(values);
    });
  });

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-white">{member.displayName}</h3>
            <Badge variant={member.isActive ? "secondary" : "outline"}>
              {member.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">{formatEnumLabel(member.role)}</Badge>
          </div>
          <p className="text-sm text-slate-300">
            {member.email ?? "No email on profile"}
          </p>
          <div className="flex flex-wrap gap-2">
            {member.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {formatEnumLabel(specialty)}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-slate-400">
            Location access: {getLocationSummary(member, locations)}
          </p>
        </div>
        <div className="text-sm text-slate-400">
          Added {new Date(member.createdAt).toLocaleDateString("en-US")}
        </div>
      </div>
      {isEditable ? (
        <Form {...form}>
          <form className="mt-5 space-y-5 border-t border-white/10 pt-5" onSubmit={submit}>
            <FormStatus
              message={actionState.message}
              tone={actionState.status === "success" ? "success" : "error"}
            />
            <PracticeMemberFormFields
              form={form}
              locationDescription="Assignments here determine which scheduled visits and locations this staff member can access."
              locations={locations}
            />
            <FormField<UpdatePracticeMemberFormValues, "isActive">
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership status</FormLabel>
                  <FormControl>
                    <label
                      className={cn(
                        "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200",
                        !field.value && "border-amber-400/40 bg-amber-500/10 text-white"
                      )}
                    >
                      <span>
                        {field.value
                          ? "Member can access the practice."
                          : "Member access is disabled."}
                      </span>
                      <input
                        checked={Boolean(field.value)}
                        className="h-4 w-4 accent-sky-400"
                        onBlur={field.onBlur}
                        onChange={(event) => field.onChange(event.target.checked)}
                        ref={field.ref}
                        type="checkbox"
                      />
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
          {isOwner
            ? "The practice owner remains read-only in this slice."
            : "Only practice owners and admins can edit team memberships."}
        </div>
      )}
    </div>
  );
}
