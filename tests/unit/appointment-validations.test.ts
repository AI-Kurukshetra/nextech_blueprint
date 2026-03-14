import { describe, expect, it } from "vitest";
import {
  createAppointmentFormSchema,
  createAppointmentSchema,
  isAppointmentStatusTransitionAllowed,
  normalizeAppointmentSubmission,
} from "@/lib/validations";

const patientId = "11111111-1111-4111-8111-111111111111";
const providerUserId = "22222222-2222-4222-8222-222222222222";
const locationId = "33333333-3333-4333-8333-333333333333";

describe("createAppointmentFormSchema", () => {
  it("accepts a valid local scheduling payload", () => {
    const result = createAppointmentFormSchema.safeParse({
      appointmentType: "follow_up",
      endsAtLocal: "2026-03-15T10:30",
      locationId,
      notes: "Arrive 15 minutes early.",
      patientId,
      providerUserId,
      roomLabel: "Room 2",
      startsAtLocal: "2026-03-15T10:00",
      visitReason: "Annual skin exam",
    });

    expect(result.success).toBe(true);
  });

  it("rejects local schedules with an end before the start", () => {
    const result = createAppointmentFormSchema.safeParse({
      appointmentType: "follow_up",
      endsAtLocal: "2026-03-15T09:30",
      locationId,
      notes: "",
      patientId,
      providerUserId,
      roomLabel: "",
      startsAtLocal: "2026-03-15T10:00",
      visitReason: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endsAtLocal).toContain(
        "End time must be after the start time."
      );
    }
  });
});

describe("createAppointmentSchema", () => {
  it("accepts a normalized UTC scheduling payload", () => {
    const result = createAppointmentSchema.safeParse({
      appointmentType: "new_patient",
      endsAt: "2026-03-15T15:30:00.000Z",
      locationId,
      notes: "",
      patientId,
      providerUserId,
      roomLabel: "",
      startsAt: "2026-03-15T15:00:00.000Z",
      visitReason: "New consult",
    });

    expect(result.success).toBe(true);
  });
});

describe("normalizeAppointmentSubmission", () => {
  it("converts local datetime values into ISO timestamps", () => {
    const normalized = normalizeAppointmentSubmission({
      appointmentType: "follow_up",
      endsAtLocal: "2026-03-15T10:30",
      locationId,
      notes: "",
      patientId,
      providerUserId,
      roomLabel: "",
      startsAtLocal: "2026-03-15T10:00",
      visitReason: "",
    });

    expect(normalized.startsAt.endsWith("Z")).toBe(true);
    expect(normalized.endsAt.endsWith("Z")).toBe(true);
  });
});

describe("isAppointmentStatusTransitionAllowed", () => {
  it("allows forward progress through the active workflow", () => {
    expect(isAppointmentStatusTransitionAllowed("scheduled", "checked_in")).toBe(
      true
    );
    expect(isAppointmentStatusTransitionAllowed("checked_in", "completed")).toBe(
      true
    );
  });

  it("rejects invalid or terminal transitions", () => {
    expect(isAppointmentStatusTransitionAllowed("completed", "scheduled")).toBe(
      false
    );
    expect(isAppointmentStatusTransitionAllowed("cancelled", "checked_in")).toBe(
      false
    );
  });
});
