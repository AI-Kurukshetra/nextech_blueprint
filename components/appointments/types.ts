import type {
  AppointmentStatus,
  AppointmentType,
  MedicalSpecialty,
  StaffRole,
} from "@/lib/validations";

export type AppointmentPatientOption = {
  chartNumber: string;
  displayName: string;
  id: string;
};

export type AppointmentLocationOption = {
  city: string | null;
  code: string;
  id: string;
  isActive: boolean;
  name: string;
  stateRegion: string | null;
};

export type AppointmentProviderOption = {
  displayName: string;
  employmentTitle: string | null;
  locationIds: string[];
  role: StaffRole;
  specialties: MedicalSpecialty[];
  userId: string;
};

export type AppointmentAgendaEntry = {
  appointmentType: AppointmentType;
  checkInAt: string | null;
  completedAt: string | null;
  createdAt: string;
  endsAt: string;
  id: string;
  location: AppointmentLocationOption | null;
  notes: string | null;
  patient: AppointmentPatientOption;
  provider: AppointmentProviderOption;
  roomLabel: string | null;
  startsAt: string;
  status: AppointmentStatus;
  visitReason: string | null;
};

export type AppointmentAgendaStats = {
  checkedInCount: number;
  completedCount: number;
  scheduledCount: number;
  totalAppointments: number;
};
