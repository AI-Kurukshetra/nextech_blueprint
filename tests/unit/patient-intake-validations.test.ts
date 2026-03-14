import { describe, expect, it } from "vitest";
import {
  normalizeChartNumber,
  normalizeDelimitedInput,
  patientIntakeSchema,
} from "@/lib/validations";

describe("normalizeChartNumber", () => {
  it("uppercases chart numbers and collapses whitespace into dashes", () => {
    expect(normalizeChartNumber(" pat 10024 ")).toBe("PAT-10024");
  });
});

describe("normalizeDelimitedInput", () => {
  it("trims, deduplicates, and normalizes comma-separated items", () => {
    expect(
      normalizeDelimitedInput("Latex, Penicillin\nLatex; Adhesive")
    ).toEqual(["Latex", "Penicillin", "Adhesive"]);
  });
});

describe("patientIntakeSchema", () => {
  it("accepts a valid intake payload with portal linkage and insurance", () => {
    const result = patientIntakeSchema.safeParse({
      addressLine1: "245 West 34th Street",
      addressLine2: "Suite 1200",
      allergiesInput: "Latex, Penicillin",
      chartNumber: "pat 10024",
      city: "New York",
      dateOfBirth: "1992-08-14",
      dermatologyFlagsInput: "Melanoma screening",
      email: "ava@example.com",
      emergencyContactName: "Ravi Patel",
      emergencyContactPhone: "+1 555 014 2299",
      firstName: "Ava",
      insuranceGroupNumber: "GRP-4400",
      insuranceMemberId: "BCBS-1002219",
      insurancePayerName: "Blue Cross Blue Shield",
      insurancePlanName: "PPO Gold",
      insuranceRelationshipToSubscriber: "Self",
      insuranceSubscriberName: "Ava Patel",
      lastName: "Patel",
      phone: "+1 555 014 2288",
      portalEmail: "patient.portal@example.com",
      postalCode: "10001",
      preferredName: "Avi",
      sexAtBirth: "female",
      stateRegion: "NY",
    });

    expect(result.success).toBe(true);
  });

  it("rejects future birth dates", () => {
    const result = patientIntakeSchema.safeParse({
      addressLine1: "",
      addressLine2: "",
      allergiesInput: "",
      chartNumber: "",
      city: "",
      dateOfBirth: "2999-01-01",
      dermatologyFlagsInput: "",
      email: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      firstName: "Ava",
      insuranceGroupNumber: "",
      insuranceMemberId: "",
      insurancePayerName: "",
      insurancePlanName: "",
      insuranceRelationshipToSubscriber: "",
      insuranceSubscriberName: "",
      lastName: "Patel",
      phone: "",
      portalEmail: "",
      postalCode: "",
      preferredName: "",
      sexAtBirth: "female",
      stateRegion: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.dateOfBirth).toContain(
        "Date of birth cannot be in the future."
      );
    }
  });

  it("rejects incomplete insurance details", () => {
    const result = patientIntakeSchema.safeParse({
      addressLine1: "",
      addressLine2: "",
      allergiesInput: "",
      chartNumber: "",
      city: "",
      dateOfBirth: "1992-08-14",
      dermatologyFlagsInput: "",
      email: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      firstName: "Ava",
      insuranceGroupNumber: "",
      insuranceMemberId: "",
      insurancePayerName: "Blue Cross Blue Shield",
      insurancePlanName: "",
      insuranceRelationshipToSubscriber: "",
      insuranceSubscriberName: "",
      lastName: "Patel",
      phone: "",
      portalEmail: "",
      postalCode: "",
      preferredName: "",
      sexAtBirth: "female",
      stateRegion: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.insuranceMemberId).toContain(
        "Enter the insurance member ID."
      );
    }
  });
});
