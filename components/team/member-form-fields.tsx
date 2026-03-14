"use client";

import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  formatEnumLabel,
  manageableStaffRoleOptions,
  medicalSpecialtyOptions,
  type ManageableStaffRole,
  type MedicalSpecialty,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { TeamLocation } from "@/components/team/types";

type PracticeMemberFieldValues = FieldValues & {
  employmentTitle: string;
  locationIds: string[];
  role: ManageableStaffRole;
  specialties: MedicalSpecialty[];
};

type PracticeMemberFormFieldsProps<
  TFormValues extends PracticeMemberFieldValues,
> = {
  disabled?: boolean;
  form: UseFormReturn<TFormValues>;
  locationDescription?: string;
  locations: TeamLocation[];
};

const controlClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60";

function toggleStringValue(values: string[], nextValue: string, checked: boolean) {
  if (checked) {
    return values.includes(nextValue) ? values : [...values, nextValue];
  }

  return values.filter((value) => value !== nextValue);
}

export function PracticeMemberFormFields<
  TFormValues extends PracticeMemberFieldValues,
>({
  disabled = false,
  form,
  locationDescription,
  locations,
}: PracticeMemberFormFieldsProps<TFormValues>) {
  const roleField = "role" as Path<TFormValues>;
  const employmentTitleField = "employmentTitle" as Path<TFormValues>;
  const specialtiesField = "specialties" as Path<TFormValues>;
  const locationIdsField = "locationIds" as Path<TFormValues>;
  const selectedRole = form.watch(roleField) as ManageableStaffRole;
  const selectedSpecialties =
    (form.watch(specialtiesField) as MedicalSpecialty[] | undefined) ?? [];
  const selectedLocationIds =
    (form.watch(locationIdsField) as string[] | undefined) ?? [];
  const isLocationScoped = selectedRole !== "practice_admin";

  return (
    <>
      <FormField<TFormValues>
        control={form.control}
        name={roleField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <FormControl>
              <select
                className={controlClassName}
                disabled={disabled}
                name={field.name}
                onBlur={field.onBlur}
                onChange={(event) =>
                  field.onChange(event.target.value as ManageableStaffRole)
                }
                ref={field.ref}
                value={String(field.value)}
              >
                {manageableStaffRoleOptions.map((role) => (
                  <option className="bg-slate-950 text-white" key={role} value={role}>
                    {formatEnumLabel(role)}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormDescription>
              Practice admins automatically keep access to every location.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<TFormValues>
        control={form.control}
        name={employmentTitleField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employment title</FormLabel>
            <FormControl>
              <Input
                disabled={disabled}
                placeholder="Lead provider, nurse, front desk manager"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<TFormValues>
        control={form.control}
        name={specialtiesField}
        render={() => (
          <FormItem>
            <FormLabel>Specialties</FormLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {medicalSpecialtyOptions.map((specialty) => {
                const checked = selectedSpecialties.includes(specialty);

                return (
                  <label
                    className={cn(
                      "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition",
                      checked && "border-sky-400/60 bg-sky-500/10 text-white",
                      disabled && "cursor-not-allowed opacity-60"
                    )}
                    key={specialty}
                  >
                    <span>{formatEnumLabel(specialty)}</span>
                    <input
                      checked={checked}
                      className="h-4 w-4 accent-sky-400"
                      disabled={disabled}
                      onChange={(event) => {
                        form.setValue(
                          specialtiesField,
                          toggleStringValue(
                            selectedSpecialties,
                            specialty,
                            event.target.checked
                          ) as PathValue<TFormValues, typeof specialtiesField>,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        );
                      }}
                      type="checkbox"
                    />
                  </label>
                );
              })}
            </div>
            <FormDescription>
              Keep the assignment aligned with the practice specialties the user supports.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<TFormValues>
        control={form.control}
        name={locationIdsField}
        render={() => (
          <FormItem>
            <FormLabel>Location access</FormLabel>
            {isLocationScoped ? (
              <div className="grid gap-2">
                {locations.length > 0 ? (
                  locations.map((location) => {
                    const checked = selectedLocationIds.includes(location.id);
                    const subtitle = [location.city, location.stateRegion]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <label
                        className={cn(
                          "rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm transition",
                          checked && "border-sky-400/60 bg-sky-500/10",
                          disabled && "cursor-not-allowed opacity-60"
                        )}
                        key={location.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">
                              {location.name}
                              {!location.isActive ? " (inactive)" : ""}
                            </p>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              {location.code}
                            </p>
                            {subtitle ? (
                              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
                            ) : null}
                          </div>
                          <input
                            checked={checked}
                            className="mt-1 h-4 w-4 accent-sky-400"
                            disabled={disabled}
                            onChange={(event) => {
                              form.setValue(
                                locationIdsField,
                                toggleStringValue(
                                  selectedLocationIds,
                                  location.id,
                                  event.target.checked
                                ) as PathValue<TFormValues, typeof locationIdsField>,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );
                            }}
                            type="checkbox"
                          />
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-400">
                    Create a location first, then assign staff access here.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Practice admins are not limited to specific locations.
              </div>
            )}
            <FormDescription>
              {locationDescription ??
                "Location-aware access applies to location records and scheduled visits."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
