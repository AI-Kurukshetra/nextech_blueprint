import type { DocumentType, StaffRole } from "@/lib/validations";

export type DocumentPatientOption = {
  chartNumber: string;
  displayName: string;
  id: string;
};

export type DocumentAppointmentOption = {
  appointmentType: string;
  id: string;
  label: string;
  patientId: string;
  status: string;
  startsAt: string;
};

export type DocumentAuthorSummary = {
  displayName: string;
  role: StaffRole;
  userId: string;
};

export type PatientDocumentEntry = {
  appointment: DocumentAppointmentOption | null;
  author: DocumentAuthorSummary | null;
  capturedAt: string | null;
  createdAt: string;
  description: string | null;
  documentType: DocumentType;
  fileName: string;
  id: string;
  isPatientVisible: boolean;
  mimeType: string;
  patient: DocumentPatientOption;
  storageBucket: string;
  storagePath: string;
};

export type PatientDocumentStats = {
  patientVisibleCount: number;
  photoCount: number;
  totalDocuments: number;
};
