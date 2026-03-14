"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { type UseFormSetError, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createPatientAction,
  type PatientActionState,
} from "@/app/actions/patients";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  administrativeSexOptions,
  formatEnumLabel,
  patientIntakeSchema,
  type PatientIntakeFormValues,
  type PatientIntakeInput,
} from "@/lib/validations";

type IntakeSectionProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
const textareaClassName =
  "flex min-h-28 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

const defaultValues: PatientIntakeFormValues = {
  addressLine1: "",
  addressLine2: "",
  allergiesInput: "",
  chartNumber: "",
  city: "",
  dateOfBirth: "",
  dermatologyFlagsInput: "",
  email: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  firstName: "",
  insuranceGroupNumber: "",
  insuranceMemberId: "",
  insurancePayerName: "",
  insurancePlanName: "",
  insuranceRelationshipToSubscriber: "",
  insuranceSubscriberName: "",
  lastName: "",
  phone: "",
  portalEmail: "",
  postalCode: "",
  preferredName: "",
  sexAtBirth: "unknown",
  stateRegion: "",
};
const initialPatientActionState: PatientActionState = { status: "idle" };

function applyFieldErrors(
  actionState: PatientActionState,
  setError: UseFormSetError<PatientIntakeFormValues>
) {
  if (!actionState.fieldErrors) {
    return;
  }

  for (const [fieldName, messages] of Object.entries(actionState.fieldErrors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    setError(fieldName as keyof PatientIntakeFormValues, {
      message,
      type: "server",
    });
  }
}

function IntakeSection({ children, description, title }: IntakeSectionProps) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function PatientIntakeForm() {
  const [actionState, submitAction, isPending] = useActionState(
    createPatientAction,
    initialPatientActionState
  );
  const router = useRouter();
  const form = useForm<PatientIntakeFormValues, undefined, PatientIntakeInput>({
    defaultValues,
    resolver: zodResolver(patientIntakeSchema),
  });

  useEffect(() => {
    applyFieldErrors(actionState, form.setError);
  }, [actionState, form]);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    form.reset(defaultValues);
    router.refresh();
  }, [actionState.status, form, router]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    startTransition(() => {
      submitAction(values);
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={submit}>
        <FormStatus
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
        <IntakeSection
          description="Capture the patient identity, chart reference, and core demographics."
          title="Demographics"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ava" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Patel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="preferredName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred name</FormLabel>
                  <FormControl>
                    <Input placeholder="Avi" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="chartNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chart number</FormLabel>
                  <FormControl>
                    <Input placeholder="PAT-10024" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Leave blank to use the generated chart identifier.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField<PatientIntakeFormValues>
            control={form.control}
            name="sexAtBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex at birth</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(event.target.value)}
                    ref={field.ref}
                    value={field.value}
                  >
                    {administrativeSexOptions.map((option) => (
                      <option className="bg-slate-950 text-white" key={option} value={option}>
                        {formatEnumLabel(option)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </IntakeSection>

        <IntakeSection
          description="Store the primary phone, email, address, and emergency contact information."
          title="Contact details"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 014 2288" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ava@example.com"
                      type="email"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="245 West 34th Street" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 1200" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="stateRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State / region</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Ravi Patel" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency contact phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1 555 014 2299"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </IntakeSection>

        <IntakeSection
          description="Track allergies, dermatology-specific flags, and any existing portal account linkage."
          title="Clinical profile and portal"
        >
          <div className="grid gap-4">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="allergiesInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <textarea
                      className={textareaClassName}
                      placeholder="Latex, Penicillin, Adhesive"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separate multiple allergies with commas, semicolons, or new lines.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="dermatologyFlagsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dermatology flags</FormLabel>
                  <FormControl>
                    <textarea
                      className={textareaClassName}
                      placeholder="Acne history, Isotretinoin candidate, Melanoma screening"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Capture quick specialty-specific intake flags for the directory.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="portalEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portal account email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="patient.portal@example.com"
                      type="email"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Link an existing registered account to enable portal access at intake.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </IntakeSection>

        <IntakeSection
          description="Capture the primary insurance details during intake when available."
          title="Primary insurance"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="insurancePayerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payer name</FormLabel>
                  <FormControl>
                    <Input placeholder="Blue Cross Blue Shield" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="insurancePlanName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan name</FormLabel>
                  <FormControl>
                    <Input placeholder="PPO Gold" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="insuranceMemberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member ID</FormLabel>
                  <FormControl>
                    <Input placeholder="BCBS-1002219" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="insuranceGroupNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group number</FormLabel>
                  <FormControl>
                    <Input placeholder="GRP-4400" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="insuranceSubscriberName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscriber name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ravi Patel" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<PatientIntakeFormValues>
              control={form.control}
              name="insuranceRelationshipToSubscriber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship to subscriber</FormLabel>
                  <FormControl>
                    <Input placeholder="Self, spouse, child" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </IntakeSection>

        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Saving intake..." : "Create patient"}
        </Button>
      </form>
    </Form>
  );
}
