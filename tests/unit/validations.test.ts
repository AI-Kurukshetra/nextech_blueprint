import { describe, expect, it } from "vitest";
import {
  createLocationSchema,
  createPracticeMemberSchema,
  normalizeLocationCode,
  normalizePracticeSlug,
  practiceOnboardingSchema,
  signUpSchema,
  updatePracticeMemberSchema,
} from "@/lib/validations";

describe("normalizePracticeSlug", () => {
  it("normalizes mixed-case names into URL-safe slugs", () => {
    expect(normalizePracticeSlug("  Mahakurukshetra Dermatology  ")).toBe(
      "mahakurukshetra-dermatology"
    );
  });

  it("collapses repeated separators", () => {
    expect(normalizePracticeSlug("skin---&---laser")).toBe("skin-laser");
  });
});

describe("normalizeLocationCode", () => {
  it("normalizes a human-readable label into an uppercase access code", () => {
    expect(normalizeLocationCode("  downtown west 01  ")).toBe("DOWNTOWN-WEST-01");
  });
});

describe("practiceOnboardingSchema", () => {
  it("accepts a valid onboarding payload", () => {
    const result = practiceOnboardingSchema.safeParse({
      practiceName: "Mahakurukshetra Dermatology",
      practiceSlug: "",
      primaryEmail: "frontdesk@mahakurukshetra.com",
      primaryPhone: "+1 555 014 2233",
      timezone: "UTC",
    });

    expect(result.success).toBe(true);
  });

  it("rejects payloads that cannot form a valid slug", () => {
    const result = practiceOnboardingSchema.safeParse({
      practiceName: "!!!",
      practiceSlug: "",
      primaryEmail: "",
      primaryPhone: "",
      timezone: "UTC",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.practiceSlug).toContain(
        "Enter a practice name or custom slug."
      );
    }
  });
});

describe("createLocationSchema", () => {
  it("accepts a valid location payload", () => {
    const result = createLocationSchema.safeParse({
      addressLine1: "245 West 34th Street",
      city: "New York",
      code: "dt-01",
      email: "downtown@mahakurukshetra.com",
      name: "Downtown suite",
      phone: "+1 555 014 2244",
      stateRegion: "NY",
    });

    expect(result.success).toBe(true);
  });

  it("rejects location payloads that cannot form a valid code", () => {
    const result = createLocationSchema.safeParse({
      addressLine1: "",
      city: "",
      code: "!!!",
      email: "",
      name: "!!!",
      phone: "",
      stateRegion: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.code).toContain(
        "Enter a location name or a valid code."
      );
    }
  });
});

describe("createPracticeMemberSchema", () => {
  it("rejects attempts to create a second practice owner membership", () => {
    const result = createPracticeMemberSchema.safeParse({
      email: "owner@example.com",
      employmentTitle: "Owner",
      locationIds: [],
      role: "practice_owner",
      specialties: ["dermatology"],
    });

    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      confirmPassword: "password-2",
      email: "owner@example.com",
      firstName: "Owner",
      lastName: "User",
      password: "password-1",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match."
      );
    }
  });
});

describe("updatePracticeMemberSchema", () => {
  it("rejects duplicate location assignments for the same member", () => {
    const result = updatePracticeMemberSchema.safeParse({
      employmentTitle: "Nurse",
      isActive: true,
      locationIds: [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000001",
      ],
      role: "nurse",
      specialties: ["dermatology"],
      userId: "00000000-0000-0000-0000-000000000010",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.locationIds).toContain(
        "Location assignments must be unique."
      );
    }
  });
});
