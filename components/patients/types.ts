import type { AdministrativeSex } from "@/lib/validations";
import type { Enums } from "@/types/supabase";

export type PrimaryInsuranceSummary = {
  memberId: string;
  payerName: string;
  planName: string | null;
};

export type PatientDirectoryEntry = {
  allergies: string[];
  chartNumber: string;
  city: string | null;
  createdAt: string;
  dateOfBirth: string;
  dermatologyFlags: string[];
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  phone: string | null;
  portalEnabled: boolean;
  preferredName: string | null;
  primaryInsurance: PrimaryInsuranceSummary | null;
  sexAtBirth: AdministrativeSex;
  stateRegion: string | null;
  status: Enums<"patient_status">;
};

export type PatientDirectoryStats = {
  insuredPatientCount: number;
  portalEnabledCount: number;
  totalPatients: number;
};
