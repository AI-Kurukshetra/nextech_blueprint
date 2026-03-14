import { describe, expect, it } from "vitest";
import {
  createPatientDocumentFormSchema,
  createPatientDocumentSchema,
  normalizePatientDocumentSubmission,
} from "@/lib/validations";

const patientId = "66666666-6666-4666-8666-666666666666";
const appointmentId = "77777777-7777-4777-8777-777777777777";

describe("createPatientDocumentFormSchema", () => {
  it("accepts a valid document metadata payload", () => {
    const result = createPatientDocumentFormSchema.safeParse({
      appointmentId,
      capturedAt: "2026-03-14T11:45",
      description: "Pre-procedure lesion image for left forearm.",
      documentType: "clinical_photo",
      fileName: "left-forearm-lesion-01.jpg",
      isPatientVisible: false,
      mimeType: "image/jpeg",
      patientId,
      storageBucket: "patient-documents",
      storagePath: "practice-a/patient-1/2026-03-14/left-forearm-lesion-01.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid captured-at values", () => {
    const result = createPatientDocumentFormSchema.safeParse({
      appointmentId: "",
      capturedAt: "14-03-2026 11:45",
      description: "",
      documentType: "consent_form",
      fileName: "consent.pdf",
      isPatientVisible: true,
      mimeType: "application/pdf",
      patientId,
      storageBucket: "patient-documents",
      storagePath: "practice-a/patient-1/consent.pdf",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capturedAt).toContain(
        "Enter a valid date and time."
      );
    }
  });
});

describe("normalizePatientDocumentSubmission", () => {
  it("transforms optional values and normalizes captured-at to ISO", () => {
    const normalized = normalizePatientDocumentSubmission({
      appointmentId: "",
      capturedAt: "2026-03-14T11:45",
      description: "",
      documentType: "lab_result",
      fileName: "cbc-results.pdf",
      isPatientVisible: true,
      mimeType: "application/pdf",
      patientId,
      storageBucket: "patient-documents",
      storagePath: "practice-a/patient-1/labs/cbc-results.pdf",
    });

    expect(normalized.appointmentId).toBeNull();
    expect(normalized.capturedAt?.endsWith("Z")).toBe(true);
  });
});

describe("createPatientDocumentSchema", () => {
  it("accepts normalized server payloads", () => {
    const result = createPatientDocumentSchema.safeParse({
      appointmentId: appointmentId,
      capturedAt: "2026-03-14T06:15:00.000Z",
      description: "Follow-up pathology report.",
      documentType: "external_record",
      fileName: "pathology-report.pdf",
      isPatientVisible: true,
      mimeType: "application/pdf",
      patientId,
      storageBucket: "patient-documents",
      storagePath: "practice-a/patient-1/pathology/pathology-report.pdf",
    });

    expect(result.success).toBe(true);
  });
});
