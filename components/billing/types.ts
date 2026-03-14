import type { BillingStatus, StaffRole } from "@/lib/validations";

export type BillingPatientOption = {
  chartNumber: string;
  displayName: string;
  id: string;
};

export type BillingAppointmentOption = {
  id: string;
  label: string;
  patientId: string;
  status: string;
};

export type BillingInsuranceOption = {
  id: string;
  isPrimary: boolean;
  memberId: string;
  patientId: string;
  payerName: string;
  planName: string | null;
};

export type BillingProviderOption = {
  displayName: string;
  role: StaffRole;
  userId: string;
};

export type BillingRecordEntry = {
  allowedAmount: number | null;
  appointment: BillingAppointmentOption | null;
  balanceAmount: number;
  cptCode: string;
  createdAt: string;
  claimReference: string | null;
  chargeAmount: number;
  icd10Codes: string[];
  id: string;
  insurance: BillingInsuranceOption | null;
  modifierCodes: string[];
  notes: string | null;
  paidAt: string | null;
  patient: BillingPatientOption;
  provider: BillingProviderOption | null;
  serviceDate: string;
  status: BillingStatus;
  submittedAt: string | null;
  units: number;
};

export type BillingRecordStats = {
  outstandingBalanceTotal: number;
  paidCount: number;
  readyOrSubmittedCount: number;
  totalCharges: number;
  totalRecords: number;
};
