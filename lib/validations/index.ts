import { z } from "zod";

const emailSchema = z.email("Enter a valid email address.");
const administrativeSexOptions = [
  "female",
  "male",
  "intersex",
  "unknown",
] as const;
const appointmentTypeOptions = [
  "new_patient",
  "follow_up",
  "procedure",
  "telehealth",
] as const;
const appointmentStatusOptions = [
  "scheduled",
  "checked_in",
  "in_room",
  "completed",
  "cancelled",
  "no_show",
] as const;
const billingStatusOptions = [
  "draft",
  "ready_to_submit",
  "submitted",
  "partially_paid",
  "paid",
  "denied",
  "void",
] as const;
const clinicalNoteTypeOptions = ["soap", "consult", "procedure", "follow_up"] as const;
const clinicalNoteStatusOptions = ["draft", "signed", "addendum"] as const;
const documentTypeOptions = [
  "clinical_photo",
  "consent_form",
  "lab_result",
  "referral",
  "insurance_card",
  "treatment_plan",
  "invoice",
  "external_record",
  "other",
] as const;
const medicalSpecialtyOptions = [
  "dermatology",
  "ophthalmology",
  "plastic_surgery",
] as const;
const staffRoleOptions = [
  "practice_owner",
  "practice_admin",
  "provider",
  "nurse",
  "medical_assistant",
  "front_desk",
  "biller",
] as const;
const manageableStaffRoleOptions = [
  "practice_admin",
  "provider",
  "nurse",
  "medical_assistant",
  "front_desk",
  "biller",
] as const;
const schedulableProviderRoleOptions = ["practice_owner", "provider"] as const;
const appointmentTypeSchema = z.enum(appointmentTypeOptions);
const appointmentStatusSchema = z.enum(appointmentStatusOptions);
const billingStatusSchema = z.enum(billingStatusOptions);
const clinicalNoteTypeSchema = z.enum(clinicalNoteTypeOptions);
const clinicalNoteStatusSchema = z.enum(clinicalNoteStatusOptions);
const documentTypeSchema = z.enum(documentTypeOptions);
const medicalSpecialtySchema = z.enum(medicalSpecialtyOptions);
const manageableStaffRoleSchema = z.enum(manageableStaffRoleOptions);
const schedulableProviderRoleSchema = z.enum(schedulableProviderRoleOptions);

const registrationPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

const signInPasswordSchema = z.string().min(1, "Enter your password.");

const optionalContactField = z.string().trim().max(120, "This value is too long.");
const optionalAddressField = z.string().trim().max(160, "This value is too long.");
const optionalChartNumberField = z
  .string()
  .trim()
  .max(32, "Chart number must be 32 characters or fewer.");
const optionalLongField = z.string().trim().max(240, "This value is too long.");
const optionalLocationField = z
  .string()
  .trim()
  .max(120, "This value is too long.");
const optionalDelimitedField = z
  .string()
  .trim()
  .max(400, "This value is too long.");
const optionalNotesField = z
  .string()
  .trim()
  .max(1000, "Notes must be 1000 characters or fewer.");
const optionalTitleField = z.string().trim().max(80, "This value is too long.");
const requiredUuidField = (message: string) => z.string().uuid(message);
const localDateTimeField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a valid date and time.");
const isoDateTimeField = z
  .string()
  .trim()
  .refine(
    (value) =>
      /(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
      !Number.isNaN(new Date(value).getTime()),
    {
      message: "Enter a valid appointment time.",
    }
  );

const appointmentStatusTransitionMap = {
  scheduled: ["checked_in", "in_room", "completed", "cancelled", "no_show"],
  checked_in: ["in_room", "completed", "cancelled", "no_show"],
  in_room: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
} as const satisfies Record<
  (typeof appointmentStatusOptions)[number],
  readonly (typeof appointmentStatusOptions)[number][]
>;

const clinicalNoteStatusTransitionMap = {
  addendum: [],
  draft: ["signed"],
  signed: ["addendum"],
} as const satisfies Record<
  (typeof clinicalNoteStatusOptions)[number],
  readonly (typeof clinicalNoteStatusOptions)[number][]
>;

const billingStatusTransitionMap = {
  denied: [],
  draft: ["ready_to_submit", "void"],
  paid: [],
  partially_paid: ["paid", "denied", "void"],
  ready_to_submit: ["submitted", "void"],
  submitted: ["partially_paid", "paid", "denied", "void"],
  void: [],
} as const satisfies Record<
  (typeof billingStatusOptions)[number],
  readonly (typeof billingStatusOptions)[number][]
>;

const optionalEmailField = z
  .string()
  .trim()
  .max(120, "This value is too long.")
  .refine((value) => !value || emailSchema.safeParse(value).success, {
    message: "Enter a valid email address.",
  });

export const signInSchema = z.object({
  email: emailSchema,
  next: z.string().trim().min(1, "Invalid redirect path."),
  password: signInPasswordSchema,
});

export const signUpSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your password."),
    email: emailSchema,
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters.")
      .max(40, "First name must be 40 characters or fewer."),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters.")
      .max(40, "Last name must be 40 characters or fewer."),
    password: registrationPasswordSchema,
  })
  .superRefine(({ confirmPassword, password }, context) => {
    if (confirmPassword !== password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export function normalizePracticeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeLocationCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeChartNumber(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export function normalizeDelimitedInput(value: string) {
  return [...new Set(value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean))];
}

export function normalizeDiagnosisCodes(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

export function normalizeBillingCodeList(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

function hasDistinctItems(values: readonly string[]) {
  return new Set(values).size === values.length;
}

export function formatEnumLabel(value: string) {
  const normalized = value.replaceAll("_", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export const practiceOnboardingSchema = z
  .object({
    practiceName: z
      .string()
      .trim()
      .min(2, "Practice name must be at least 2 characters.")
      .max(80, "Practice name must be 80 characters or fewer."),
    practiceSlug: z.string().trim().max(80, "Practice slug is too long."),
    primaryEmail: optionalEmailField,
    primaryPhone: optionalContactField,
    timezone: z
      .string()
      .trim()
      .min(2, "Enter a timezone.")
      .max(100, "Timezone must be 100 characters or fewer."),
  })
  .superRefine(({ practiceName, practiceSlug }, context) => {
    const normalizedSlug = normalizePracticeSlug(practiceSlug || practiceName);

    if (!normalizedSlug) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a practice name or custom slug.",
        path: ["practiceSlug"],
      });
      return;
    }

    if (normalizedSlug.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Practice slug must be at least 2 characters.",
        path: ["practiceSlug"],
      });
    }
  });

export const createLocationSchema = z
  .object({
    addressLine1: optionalLocationField,
    city: optionalLocationField,
    code: z.string().trim().max(24, "Location code must be 24 characters or fewer."),
    email: optionalEmailField,
    name: z
      .string()
      .trim()
      .min(2, "Location name must be at least 2 characters.")
      .max(80, "Location name must be 80 characters or fewer."),
    phone: optionalContactField,
    stateRegion: optionalLocationField,
  })
  .superRefine(({ code, name }, context) => {
    const normalizedCode = normalizeLocationCode(code || name);

    if (!normalizedCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a location name or a valid code.",
        path: ["code"],
      });
      return;
    }

    if (normalizedCode.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location code must be at least 2 characters.",
        path: ["code"],
      });
    }
  });

export const patientIntakeSchema = z
  .object({
    addressLine1: optionalAddressField,
    addressLine2: optionalAddressField,
    allergiesInput: optionalDelimitedField,
    chartNumber: optionalChartNumberField,
    city: optionalLocationField,
    dateOfBirth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.")
      .refine((value) => value <= new Date().toISOString().slice(0, 10), {
        message: "Date of birth cannot be in the future.",
      }),
    dermatologyFlagsInput: optionalDelimitedField,
    email: optionalEmailField,
    emergencyContactName: optionalLongField,
    emergencyContactPhone: optionalContactField,
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters.")
      .max(40, "First name must be 40 characters or fewer."),
    insuranceGroupNumber: optionalLongField,
    insuranceMemberId: optionalLongField,
    insurancePayerName: optionalLongField,
    insurancePlanName: optionalLongField,
    insuranceRelationshipToSubscriber: optionalLongField,
    insuranceSubscriberName: optionalLongField,
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters.")
      .max(40, "Last name must be 40 characters or fewer."),
    phone: optionalContactField,
    portalEmail: optionalEmailField,
    postalCode: z.string().trim().max(20, "Postal code is too long."),
    preferredName: z
      .string()
      .trim()
      .max(40, "Preferred name must be 40 characters or fewer."),
    sexAtBirth: z.enum(administrativeSexOptions),
    stateRegion: optionalLocationField,
  })
  .superRefine(
    (
      {
        allergiesInput,
        chartNumber,
        dermatologyFlagsInput,
        insuranceGroupNumber,
        insuranceMemberId,
        insurancePayerName,
        insurancePlanName,
        insuranceRelationshipToSubscriber,
        insuranceSubscriberName,
      },
      context
    ) => {
      const normalizedChartNumber = normalizeChartNumber(chartNumber);

      if (normalizedChartNumber && normalizedChartNumber.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Chart number must be at least 2 characters.",
          path: ["chartNumber"],
        });
      }

      const hasInsuranceDetails = [
        insurancePayerName,
        insurancePlanName,
        insuranceMemberId,
        insuranceGroupNumber,
        insuranceSubscriberName,
        insuranceRelationshipToSubscriber,
      ].some(Boolean);

      if (hasInsuranceDetails && !insurancePayerName) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the primary insurance payer name.",
          path: ["insurancePayerName"],
        });
      }

      if (hasInsuranceDetails && !insuranceMemberId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the insurance member ID.",
          path: ["insuranceMemberId"],
        });
      }

      if (normalizeDelimitedInput(allergiesInput).length > 12) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keep allergies to 12 items or fewer.",
          path: ["allergiesInput"],
        });
      }

      if (normalizeDelimitedInput(dermatologyFlagsInput).length > 12) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keep dermatology flags to 12 items or fewer.",
          path: ["dermatologyFlagsInput"],
        });
      }
    }
  );

export const createAppointmentFormSchema = z
  .object({
    appointmentType: appointmentTypeSchema,
    endsAtLocal: localDateTimeField,
    locationId: requiredUuidField("Select a location."),
    notes: optionalNotesField,
    patientId: requiredUuidField("Select a patient."),
    providerUserId: requiredUuidField("Select a provider."),
    roomLabel: optionalTitleField,
    startsAtLocal: localDateTimeField,
    visitReason: optionalLongField,
  })
  .superRefine(({ endsAtLocal, startsAtLocal }, context) => {
    if (
      !Number.isNaN(new Date(startsAtLocal).getTime()) &&
      !Number.isNaN(new Date(endsAtLocal).getTime()) &&
      new Date(endsAtLocal).getTime() <= new Date(startsAtLocal).getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after the start time.",
        path: ["endsAtLocal"],
      });
    }
  });

export const createAppointmentSchema = z
  .object({
    appointmentType: appointmentTypeSchema,
    endsAt: isoDateTimeField,
    locationId: requiredUuidField("Select a location."),
    notes: optionalNotesField,
    patientId: requiredUuidField("Select a patient."),
    providerUserId: requiredUuidField("Select a provider."),
    roomLabel: optionalTitleField,
    startsAt: isoDateTimeField,
    visitReason: optionalLongField,
  })
  .superRefine(({ endsAt, startsAt }, context) => {
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after the start time.",
        path: ["endsAt"],
      });
    }
  });

export const updateAppointmentStatusSchema = z.object({
  appointmentId: requiredUuidField("Select a valid appointment."),
  nextStatus: appointmentStatusSchema,
});

export const createClinicalNoteFormSchema = z
  .object({
    appointmentId: z.string().trim().uuid("Select a valid appointment.").or(z.literal("")),
    assessment: optionalNotesField,
    diagnosisCodesInput: optionalDelimitedField,
    isPatientVisible: z.boolean(),
    noteType: clinicalNoteTypeSchema,
    objective: optionalNotesField,
    patientId: requiredUuidField("Select a patient."),
    plan: optionalNotesField,
    subjective: optionalNotesField,
  })
  .superRefine(
    ({ assessment, diagnosisCodesInput, objective, plan, subjective }, context) => {
      const hasClinicalContent = [subjective, objective, assessment, plan].some(Boolean);

      if (!hasClinicalContent) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Capture at least one SOAP section before saving.",
          path: ["subjective"],
        });
      }

      if (normalizeDiagnosisCodes(diagnosisCodesInput).length > 12) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keep diagnosis codes to 12 items or fewer.",
          path: ["diagnosisCodesInput"],
        });
      }
    }
  );

export const createClinicalNoteSchema = z
  .object({
    appointmentId: z.string().trim().uuid("Select a valid appointment.").nullable(),
    assessment: optionalNotesField,
    diagnosisCodes: z
      .array(z.string().trim().min(1))
      .max(12, "Keep diagnosis codes to 12 items or fewer."),
    isPatientVisible: z.boolean(),
    noteType: clinicalNoteTypeSchema,
    objective: optionalNotesField,
    patientId: requiredUuidField("Select a patient."),
    plan: optionalNotesField,
    subjective: optionalNotesField,
  })
  .superRefine(({ assessment, objective, plan, subjective }, context) => {
    const hasClinicalContent = [subjective, objective, assessment, plan].some(Boolean);

    if (!hasClinicalContent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Capture at least one SOAP section before saving.",
        path: ["subjective"],
      });
    }
  });

export const updateClinicalNoteStatusSchema = z.object({
  nextStatus: clinicalNoteStatusSchema,
  noteId: requiredUuidField("Select a valid note."),
});

export const updateClinicalNoteVisibilitySchema = z.object({
  isPatientVisible: z.boolean(),
  noteId: requiredUuidField("Select a valid note."),
});

export const createPatientDocumentFormSchema = z.object({
  appointmentId: z.string().trim().uuid("Select a valid appointment.").or(z.literal("")),
  capturedAt: localDateTimeField.or(z.literal("")),
  description: optionalNotesField,
  documentType: documentTypeSchema,
  fileName: z
    .string()
    .trim()
    .min(2, "File name must be at least 2 characters.")
    .max(180, "File name must be 180 characters or fewer."),
  isPatientVisible: z.boolean(),
  mimeType: z
    .string()
    .trim()
    .min(3, "MIME type is required.")
    .max(120, "MIME type is too long."),
  patientId: requiredUuidField("Select a patient."),
  storageBucket: z
    .string()
    .trim()
    .min(2, "Storage bucket is required.")
    .max(80, "Storage bucket is too long."),
  storagePath: z
    .string()
    .trim()
    .min(4, "Storage path is required.")
    .max(240, "Storage path is too long."),
});

export const createPatientDocumentSchema = z.object({
  appointmentId: z.string().trim().uuid("Select a valid appointment.").nullable(),
  capturedAt: isoDateTimeField.nullable(),
  description: optionalNotesField,
  documentType: documentTypeSchema,
  fileName: z
    .string()
    .trim()
    .min(2, "File name must be at least 2 characters.")
    .max(180, "File name must be 180 characters or fewer."),
  isPatientVisible: z.boolean(),
  mimeType: z
    .string()
    .trim()
    .min(3, "MIME type is required.")
    .max(120, "MIME type is too long."),
  patientId: requiredUuidField("Select a patient."),
  storageBucket: z
    .string()
    .trim()
    .min(2, "Storage bucket is required.")
    .max(80, "Storage bucket is too long."),
  storagePath: z
    .string()
    .trim()
    .min(4, "Storage path is required.")
    .max(240, "Storage path is too long."),
});

export const updatePatientDocumentVisibilitySchema = z.object({
  documentId: requiredUuidField("Select a valid document."),
  isPatientVisible: z.boolean(),
});

export const createBillingRecordFormSchema = z
  .object({
    allowedAmount: z.coerce.number().min(0, "Allowed amount must be zero or greater."),
    appointmentId: z.string().trim().uuid("Select a valid appointment.").or(z.literal("")),
    balanceAmount: z.coerce.number().min(0, "Balance must be zero or greater."),
    claimReference: z.string().trim().max(80, "Claim reference is too long."),
    cptCode: z
      .string()
      .trim()
      .min(3, "CPT code must be at least 3 characters.")
      .max(20, "CPT code is too long."),
    icd10CodesInput: optionalDelimitedField,
    insurancePolicyId: z
      .string()
      .trim()
      .uuid("Select a valid insurance policy.")
      .or(z.literal("")),
    modifierCodesInput: optionalDelimitedField,
    notes: optionalNotesField,
    paidAt: localDateTimeField.or(z.literal("")),
    patientId: requiredUuidField("Select a patient."),
    renderingProviderUserId: z
      .string()
      .trim()
      .uuid("Select a valid rendering provider.")
      .or(z.literal("")),
    serviceDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid service date."),
    status: billingStatusSchema,
    submittedAt: localDateTimeField.or(z.literal("")),
    units: z.coerce.number().int("Units must be a whole number.").min(1).max(20),
    chargeAmount: z.coerce.number().min(0, "Charge amount must be zero or greater."),
  })
  .superRefine(
    (
      {
        allowedAmount,
        balanceAmount,
        chargeAmount,
        icd10CodesInput,
        modifierCodesInput,
        status,
      },
      context
    ) => {
      if (allowedAmount > chargeAmount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Allowed amount cannot exceed the charge amount.",
          path: ["allowedAmount"],
        });
      }

      if (balanceAmount > chargeAmount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Balance cannot exceed the charge amount.",
          path: ["balanceAmount"],
        });
      }

      if (normalizeBillingCodeList(modifierCodesInput).length > 6) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keep modifier codes to 6 items or fewer.",
          path: ["modifierCodesInput"],
        });
      }

      if (normalizeBillingCodeList(icd10CodesInput).length > 12) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Keep ICD-10 codes to 12 items or fewer.",
          path: ["icd10CodesInput"],
        });
      }

      if (status === "paid" && balanceAmount !== 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paid records must have a zero balance.",
          path: ["balanceAmount"],
        });
      }
    }
  );

export const createBillingRecordSchema = z
  .object({
    allowedAmount: z.number().min(0, "Allowed amount must be zero or greater."),
    appointmentId: z.string().trim().uuid("Select a valid appointment.").nullable(),
    balanceAmount: z.number().min(0, "Balance must be zero or greater."),
    claimReference: z.string().trim().max(80, "Claim reference is too long."),
    cptCode: z
      .string()
      .trim()
      .min(3, "CPT code must be at least 3 characters.")
      .max(20, "CPT code is too long."),
    icd10Codes: z.array(z.string().trim().min(1)).max(12),
    insurancePolicyId: z.string().trim().uuid("Select a valid insurance policy.").nullable(),
    modifierCodes: z.array(z.string().trim().min(1)).max(6),
    notes: optionalNotesField,
    paidAt: isoDateTimeField.nullable(),
    patientId: requiredUuidField("Select a patient."),
    renderingProviderUserId: z
      .string()
      .trim()
      .uuid("Select a valid rendering provider.")
      .nullable(),
    serviceDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid service date."),
    status: billingStatusSchema,
    submittedAt: isoDateTimeField.nullable(),
    units: z.number().int("Units must be a whole number.").min(1).max(20),
    chargeAmount: z.number().min(0, "Charge amount must be zero or greater."),
  })
  .superRefine(
    ({ allowedAmount, balanceAmount, chargeAmount, status }, context) => {
      if (allowedAmount > chargeAmount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Allowed amount cannot exceed the charge amount.",
          path: ["allowedAmount"],
        });
      }

      if (balanceAmount > chargeAmount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Balance cannot exceed the charge amount.",
          path: ["balanceAmount"],
        });
      }

      if (status === "paid" && balanceAmount !== 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paid records must have a zero balance.",
          path: ["balanceAmount"],
        });
      }
    }
  );

export const updateBillingRecordStatusSchema = z.object({
  balanceAmount: z.number().min(0, "Balance must be zero or greater.").optional(),
  nextStatus: billingStatusSchema,
  recordId: requiredUuidField("Select a valid billing record."),
});

export function isAppointmentStatusTransitionAllowed(
  currentStatus: (typeof appointmentStatusOptions)[number],
  nextStatus: (typeof appointmentStatusOptions)[number]
) {
  return appointmentStatusTransitionMap[currentStatus].some(
    (status) => status === nextStatus
  );
}

export function isClinicalNoteStatusTransitionAllowed(
  currentStatus: (typeof clinicalNoteStatusOptions)[number],
  nextStatus: (typeof clinicalNoteStatusOptions)[number]
) {
  return clinicalNoteStatusTransitionMap[currentStatus].some(
    (status) => status === nextStatus
  );
}

export function isBillingStatusTransitionAllowed(
  currentStatus: (typeof billingStatusOptions)[number],
  nextStatus: (typeof billingStatusOptions)[number]
) {
  return billingStatusTransitionMap[currentStatus].some(
    (status) => status === nextStatus
  );
}

export function normalizeAppointmentSubmission(
  values: z.output<typeof createAppointmentFormSchema>
) {
  return {
    appointmentType: values.appointmentType,
    endsAt: new Date(values.endsAtLocal).toISOString(),
    locationId: values.locationId,
    notes: values.notes,
    patientId: values.patientId,
    providerUserId: values.providerUserId,
    roomLabel: values.roomLabel,
    startsAt: new Date(values.startsAtLocal).toISOString(),
    visitReason: values.visitReason,
  };
}

export function normalizeClinicalNoteSubmission(
  values: z.output<typeof createClinicalNoteFormSchema>
) {
  return {
    appointmentId: values.appointmentId || null,
    assessment: values.assessment,
    diagnosisCodes: normalizeDiagnosisCodes(values.diagnosisCodesInput),
    isPatientVisible: values.isPatientVisible,
    noteType: values.noteType,
    objective: values.objective,
    patientId: values.patientId,
    plan: values.plan,
    subjective: values.subjective,
  };
}

export function normalizePatientDocumentSubmission(
  values: z.output<typeof createPatientDocumentFormSchema>
) {
  return {
    appointmentId: values.appointmentId || null,
    capturedAt: values.capturedAt ? new Date(values.capturedAt).toISOString() : null,
    description: values.description,
    documentType: values.documentType,
    fileName: values.fileName,
    isPatientVisible: values.isPatientVisible,
    mimeType: values.mimeType,
    patientId: values.patientId,
    storageBucket: values.storageBucket,
    storagePath: values.storagePath,
  };
}

export function normalizeBillingRecordSubmission(
  values: z.output<typeof createBillingRecordFormSchema>
) {
  return {
    allowedAmount: values.allowedAmount,
    appointmentId: values.appointmentId || null,
    balanceAmount: values.balanceAmount,
    claimReference: values.claimReference,
    cptCode: values.cptCode.toUpperCase(),
    icd10Codes: normalizeBillingCodeList(values.icd10CodesInput),
    insurancePolicyId: values.insurancePolicyId || null,
    modifierCodes: normalizeBillingCodeList(values.modifierCodesInput),
    notes: values.notes,
    paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : null,
    patientId: values.patientId,
    renderingProviderUserId: values.renderingProviderUserId || null,
    serviceDate: values.serviceDate,
    status: values.status,
    submittedAt: values.submittedAt ? new Date(values.submittedAt).toISOString() : null,
    units: values.units,
    chargeAmount: values.chargeAmount,
  };
}

const practiceMemberBaseSchema = z
  .object({
    employmentTitle: optionalTitleField,
    locationIds: z
      .array(z.string().uuid("Select a valid location."))
      .max(24, "Too many locations selected."),
    role: manageableStaffRoleSchema,
    specialties: z
      .array(medicalSpecialtySchema)
      .min(1, "Select at least one specialty.")
      .max(3, "Too many specialties selected."),
  })
  .superRefine(({ locationIds, specialties }, context) => {
    if (!hasDistinctItems(locationIds)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location assignments must be unique.",
        path: ["locationIds"],
      });
    }

    if (!hasDistinctItems(specialties)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Specialties must be unique.",
        path: ["specialties"],
      });
    }
  });

export const createPracticeMemberSchema = practiceMemberBaseSchema.extend({
  email: emailSchema,
});

export const updatePracticeMemberSchema = practiceMemberBaseSchema.extend({
  isActive: z.boolean(),
  userId: z.string().uuid("Select a valid team member."),
});

export type SignInFormValues = z.input<typeof signInSchema>;
export type SignInInput = z.output<typeof signInSchema>;
export type SignUpFormValues = z.input<typeof signUpSchema>;
export type SignUpInput = z.output<typeof signUpSchema>;
export type PracticeOnboardingFormValues = z.input<
  typeof practiceOnboardingSchema
>;
export type PracticeOnboardingInput = z.output<
  typeof practiceOnboardingSchema
>;
export type AdministrativeSex = (typeof administrativeSexOptions)[number];
export type AppointmentType = (typeof appointmentTypeOptions)[number];
export type AppointmentStatus = (typeof appointmentStatusOptions)[number];
export type BillingStatus = (typeof billingStatusOptions)[number];
export type ClinicalNoteType = (typeof clinicalNoteTypeOptions)[number];
export type ClinicalNoteStatus = (typeof clinicalNoteStatusOptions)[number];
export type DocumentType = (typeof documentTypeOptions)[number];
export type MedicalSpecialty = (typeof medicalSpecialtyOptions)[number];
export type StaffRole = (typeof staffRoleOptions)[number];
export type ManageableStaffRole = (typeof manageableStaffRoleOptions)[number];
export type SchedulableProviderRole =
  (typeof schedulableProviderRoleOptions)[number];
export type CreateLocationFormValues = z.input<typeof createLocationSchema>;
export type CreateLocationInput = z.output<typeof createLocationSchema>;
export type PatientIntakeFormValues = z.input<typeof patientIntakeSchema>;
export type PatientIntakeInput = z.output<typeof patientIntakeSchema>;
export type CreateAppointmentFormValues = z.input<
  typeof createAppointmentFormSchema
>;
export type CreateAppointmentFormOutput = z.output<
  typeof createAppointmentFormSchema
>;
export type CreateAppointmentInput = z.output<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.output<
  typeof updateAppointmentStatusSchema
>;
export type CreateClinicalNoteFormValues = z.input<
  typeof createClinicalNoteFormSchema
>;
export type CreateClinicalNoteFormOutput = z.output<
  typeof createClinicalNoteFormSchema
>;
export type CreateClinicalNoteInput = z.output<typeof createClinicalNoteSchema>;
export type UpdateClinicalNoteStatusInput = z.output<
  typeof updateClinicalNoteStatusSchema
>;
export type UpdateClinicalNoteVisibilityInput = z.output<
  typeof updateClinicalNoteVisibilitySchema
>;
export type CreatePatientDocumentFormValues = z.input<
  typeof createPatientDocumentFormSchema
>;
export type CreatePatientDocumentFormOutput = z.output<
  typeof createPatientDocumentFormSchema
>;
export type CreatePatientDocumentInput = z.output<
  typeof createPatientDocumentSchema
>;
export type UpdatePatientDocumentVisibilityInput = z.output<
  typeof updatePatientDocumentVisibilitySchema
>;
export type CreateBillingRecordFormValues = z.input<
  typeof createBillingRecordFormSchema
>;
export type CreateBillingRecordFormOutput = z.output<
  typeof createBillingRecordFormSchema
>;
export type CreateBillingRecordInput = z.output<typeof createBillingRecordSchema>;
export type UpdateBillingRecordStatusInput = z.output<
  typeof updateBillingRecordStatusSchema
>;
export type CreatePracticeMemberFormValues = z.input<
  typeof createPracticeMemberSchema
>;
export type CreatePracticeMemberInput = z.output<
  typeof createPracticeMemberSchema
>;
export type UpdatePracticeMemberFormValues = z.input<
  typeof updatePracticeMemberSchema
>;
export type UpdatePracticeMemberInput = z.output<
  typeof updatePracticeMemberSchema
>;
export {
  administrativeSexOptions,
  appointmentStatusOptions,
  appointmentTypeOptions,
  billingStatusOptions,
  clinicalNoteStatusOptions,
  clinicalNoteTypeOptions,
  documentTypeOptions,
  manageableStaffRoleOptions,
  medicalSpecialtyOptions,
  schedulableProviderRoleOptions,
  schedulableProviderRoleSchema,
  staffRoleOptions,
};
