import { describe, expect, it } from "vitest";
import {
  createBillingRecordFormSchema,
  createBillingRecordSchema,
  isBillingStatusTransitionAllowed,
  normalizeBillingRecordSubmission,
  normalizeBillingCodeList,
} from "@/lib/validations";

const patientId = "88888888-8888-4888-8888-888888888888";
const appointmentId = "99999999-9999-4999-8999-999999999999";

describe("normalizeBillingCodeList", () => {
  it("normalizes, uppercases, and deduplicates codes", () => {
    expect(normalizeBillingCodeList("25, 59\n25;ga")).toEqual(["25", "59", "GA"]);
  });
});

describe("createBillingRecordFormSchema", () => {
  it("accepts a valid billing form payload", () => {
    const result = createBillingRecordFormSchema.safeParse({
      allowedAmount: 95,
      appointmentId,
      balanceAmount: 120,
      chargeAmount: 120,
      claimReference: "CLM-2026-001",
      cptCode: "99213",
      icd10CodesInput: "L70.0, L81.4",
      insurancePolicyId: "",
      modifierCodesInput: "25",
      notes: "Initial claim submission.",
      paidAt: "",
      patientId,
      renderingProviderUserId: "",
      serviceDate: "2026-03-14",
      status: "ready_to_submit",
      submittedAt: "",
      units: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects balance values above charge", () => {
    const result = createBillingRecordFormSchema.safeParse({
      allowedAmount: 50,
      appointmentId: "",
      balanceAmount: 150,
      chargeAmount: 120,
      claimReference: "",
      cptCode: "99213",
      icd10CodesInput: "",
      insurancePolicyId: "",
      modifierCodesInput: "",
      notes: "",
      paidAt: "",
      patientId,
      renderingProviderUserId: "",
      serviceDate: "2026-03-14",
      status: "draft",
      submittedAt: "",
      units: 1,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.balanceAmount).toContain(
        "Balance cannot exceed the charge amount."
      );
    }
  });
});

describe("normalizeBillingRecordSubmission", () => {
  it("converts local values into server payload shape", () => {
    const normalized = normalizeBillingRecordSubmission({
      allowedAmount: 95,
      appointmentId: "",
      balanceAmount: 120,
      chargeAmount: 120,
      claimReference: "clm-2026-001",
      cptCode: "99213",
      icd10CodesInput: "l70.0, l81.4",
      insurancePolicyId: "",
      modifierCodesInput: "25",
      notes: "",
      paidAt: "2026-03-15T09:30",
      patientId,
      renderingProviderUserId: "",
      serviceDate: "2026-03-14",
      status: "submitted",
      submittedAt: "2026-03-15T09:00",
      units: 1,
    });

    expect(normalized.appointmentId).toBeNull();
    expect(normalized.cptCode).toBe("99213");
    expect(normalized.icd10Codes).toEqual(["L70.0", "L81.4"]);
    expect(normalized.submittedAt?.endsWith("Z")).toBe(true);
  });
});

describe("createBillingRecordSchema", () => {
  it("accepts normalized billing payloads", () => {
    const result = createBillingRecordSchema.safeParse({
      allowedAmount: 95,
      appointmentId,
      balanceAmount: 0,
      chargeAmount: 120,
      claimReference: "CLM-2026-001",
      cptCode: "99213",
      icd10Codes: ["L70.0", "L81.4"],
      insurancePolicyId: null,
      modifierCodes: ["25"],
      notes: "",
      paidAt: "2026-03-15T04:00:00.000Z",
      patientId,
      renderingProviderUserId: null,
      serviceDate: "2026-03-14",
      status: "paid",
      submittedAt: "2026-03-15T03:00:00.000Z",
      units: 1,
    });

    expect(result.success).toBe(true);
  });
});

describe("isBillingStatusTransitionAllowed", () => {
  it("allows forward billing transitions", () => {
    expect(isBillingStatusTransitionAllowed("draft", "ready_to_submit")).toBe(true);
    expect(isBillingStatusTransitionAllowed("submitted", "partially_paid")).toBe(true);
    expect(isBillingStatusTransitionAllowed("partially_paid", "paid")).toBe(true);
  });

  it("rejects invalid or terminal transitions", () => {
    expect(isBillingStatusTransitionAllowed("draft", "paid")).toBe(false);
    expect(isBillingStatusTransitionAllowed("paid", "submitted")).toBe(false);
  });
});
