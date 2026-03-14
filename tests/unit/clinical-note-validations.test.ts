import { describe, expect, it } from "vitest";
import {
  createClinicalNoteFormSchema,
  createClinicalNoteSchema,
  isClinicalNoteStatusTransitionAllowed,
  normalizeClinicalNoteSubmission,
  normalizeDiagnosisCodes,
} from "@/lib/validations";

const patientId = "44444444-4444-4444-8444-444444444444";
const appointmentId = "55555555-5555-4555-8555-555555555555";

describe("normalizeDiagnosisCodes", () => {
  it("normalizes, uppercases, and deduplicates diagnosis codes", () => {
    expect(normalizeDiagnosisCodes("l70.0, c44.91\nL70.0;L81.4")).toEqual([
      "L70.0",
      "C44.91",
      "L81.4",
    ]);
  });
});

describe("createClinicalNoteFormSchema", () => {
  it("accepts a valid SOAP draft payload", () => {
    const result = createClinicalNoteFormSchema.safeParse({
      appointmentId,
      assessment: "Acne vulgaris with post-inflammatory hyperpigmentation.",
      diagnosisCodesInput: "L70.0, L81.4",
      isPatientVisible: true,
      noteType: "soap",
      objective: "Comedonal and inflammatory papules over cheeks and forehead.",
      patientId,
      plan: "Start topical retinoid nightly. Follow-up in 8 weeks.",
      subjective: "Patient reports worsening acne over the last 3 months.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects payloads with no SOAP content", () => {
    const result = createClinicalNoteFormSchema.safeParse({
      appointmentId: "",
      assessment: "",
      diagnosisCodesInput: "",
      isPatientVisible: false,
      noteType: "soap",
      objective: "",
      patientId,
      plan: "",
      subjective: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.subjective).toContain(
        "Capture at least one SOAP section before saving."
      );
    }
  });
});

describe("normalizeClinicalNoteSubmission", () => {
  it("transforms form payload into server payload shape", () => {
    const normalized = normalizeClinicalNoteSubmission({
      appointmentId: "",
      assessment: "Assessment",
      diagnosisCodesInput: "l70.0, l81.4",
      isPatientVisible: true,
      noteType: "soap",
      objective: "Objective",
      patientId,
      plan: "Plan",
      subjective: "Subjective",
    });

    expect(normalized.appointmentId).toBeNull();
    expect(normalized.diagnosisCodes).toEqual(["L70.0", "L81.4"]);
  });
});

describe("createClinicalNoteSchema", () => {
  it("accepts normalized clinical-note payload", () => {
    const result = createClinicalNoteSchema.safeParse({
      appointmentId,
      assessment: "Assessment",
      diagnosisCodes: ["L70.0"],
      isPatientVisible: false,
      noteType: "consult",
      objective: "Objective",
      patientId,
      plan: "Plan",
      subjective: "Subjective",
    });

    expect(result.success).toBe(true);
  });
});

describe("isClinicalNoteStatusTransitionAllowed", () => {
  it("allows draft to signed and signed to addendum", () => {
    expect(isClinicalNoteStatusTransitionAllowed("draft", "signed")).toBe(true);
    expect(isClinicalNoteStatusTransitionAllowed("signed", "addendum")).toBe(true);
  });

  it("rejects invalid or terminal transitions", () => {
    expect(isClinicalNoteStatusTransitionAllowed("draft", "addendum")).toBe(false);
    expect(isClinicalNoteStatusTransitionAllowed("addendum", "signed")).toBe(false);
  });
});
