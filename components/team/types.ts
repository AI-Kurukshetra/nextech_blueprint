import type { MedicalSpecialty, StaffRole } from "@/lib/validations";

export type TeamLocation = {
  city: string | null;
  code: string;
  id: string;
  isActive: boolean;
  name: string;
  stateRegion: string | null;
};

export type TeamMember = {
  createdAt: string;
  displayName: string;
  email: string | null;
  employmentTitle: string | null;
  isActive: boolean;
  locationIds: string[];
  role: StaffRole;
  specialties: MedicalSpecialty[];
  userId: string;
};
