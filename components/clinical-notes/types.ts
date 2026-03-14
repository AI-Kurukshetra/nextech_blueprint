import type {
  ClinicalNoteStatus,
  ClinicalNoteType,
  StaffRole,
} from "@/lib/validations";

export type ClinicalNotePatientOption = {
  chartNumber: string;
  displayName: string;
  id: string;
};

export type ClinicalNoteAppointmentOption = {
  appointmentType: string;
  id: string;
  label: string;
  patientId: string;
  status: string;
  startsAt: string;
};

export type ClinicalNoteAuthorSummary = {
  displayName: string;
  role: StaffRole;
  userId: string;
};

export type ClinicalNoteEntry = {
  appointment: ClinicalNoteAppointmentOption | null;
  assessment: string | null;
  author: ClinicalNoteAuthorSummary;
  createdAt: string;
  diagnosisCodes: string[];
  id: string;
  isPatientVisible: boolean;
  noteType: ClinicalNoteType;
  objective: string | null;
  patient: ClinicalNotePatientOption;
  plan: string | null;
  signedAt: string | null;
  status: ClinicalNoteStatus;
  subjective: string | null;
};

export type ClinicalNoteStats = {
  draftCount: number;
  patientVisibleCount: number;
  signedOrAddendumCount: number;
  totalNotes: number;
};
