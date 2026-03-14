import type { Metadata } from "next";
import { AppointmentAgenda } from "@/components/appointments/appointment-agenda";
import { CreateAppointmentForm } from "@/components/appointments/create-appointment-form";
import type {
  AppointmentAgendaEntry,
  AppointmentAgendaStats,
  AppointmentLocationOption,
  AppointmentPatientOption,
  AppointmentProviderOption,
} from "@/components/appointments/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserPracticeContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEnumLabel } from "@/lib/validations";
import type { Tables } from "@/types/supabase";

type AppointmentRow = Pick<
  Tables<"appointments">,
  | "appointment_type"
  | "check_in_at"
  | "completed_at"
  | "created_at"
  | "ends_at"
  | "id"
  | "location_id"
  | "notes"
  | "patient_id"
  | "provider_user_id"
  | "room_label"
  | "starts_at"
  | "status"
  | "visit_reason"
>;

type LocationRow = Pick<
  Tables<"locations">,
  "city" | "code" | "id" | "is_active" | "name" | "state_region"
>;

type PatientRow = Pick<
  Tables<"patients">,
  "chart_number" | "first_name" | "id" | "last_name" | "preferred_name" | "status"
>;

type ProfileRow = Pick<
  Tables<"profiles">,
  "display_name" | "email" | "first_name" | "id" | "last_name"
>;

type PracticeMembershipRow = Pick<
  Tables<"practice_memberships">,
  "employment_title" | "is_active" | "role" | "specialties" | "user_id"
>;

type PracticeMemberLocationRow = Pick<
  Tables<"practice_member_locations">,
  "location_id" | "user_id"
>;

export const metadata: Metadata = {
  title: "Appointments",
  description: "Appointment scheduling and lifecycle management workspace.",
};

function getProfileDisplayName(profile: ProfileRow | null) {
  if (profile?.display_name) {
    return profile.display_name;
  }

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return profile?.email ?? "Practice provider";
}

function getPatientDisplayName(patient: PatientRow) {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  if (patient.preferred_name) {
    return `${fullName} (${patient.preferred_name})`;
  }

  return fullName;
}

export default async function AppointmentsPage() {
  const context = await requireUserPracticeContext();
  const supabase = await createClient();
  const practiceId = context.practice.id;
  const [
    { data: patientRows, error: patientsError },
    { data: membershipRows, error: membershipsError },
    { data: locationRows, error: locationsError },
    { data: assignmentRows, error: assignmentsError },
    { data: appointmentRows, error: appointmentsError },
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name, preferred_name, chart_number, status")
      .eq("practice_id", practiceId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase
      .from("practice_memberships")
      .select("user_id, role, specialties, employment_title, is_active")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("locations")
      .select("id, name, code, city, state_region, is_active")
      .eq("practice_id", practiceId)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("practice_member_locations")
      .select("user_id, location_id")
      .eq("practice_id", practiceId),
    supabase
      .from("appointments")
      .select(
        "id, patient_id, provider_user_id, location_id, appointment_type, status, starts_at, ends_at, visit_reason, room_label, notes, check_in_at, completed_at, created_at"
      )
      .eq("practice_id", practiceId)
      .order("starts_at", { ascending: true })
      .limit(200),
  ]);

  if (
    patientsError ||
    membershipsError ||
    locationsError ||
    assignmentsError ||
    appointmentsError
  ) {
    throw new Error("Appointment scheduling workspace could not be loaded.");
  }

  const memberships = (membershipRows as PracticeMembershipRow[] | null) ?? [];
  const patients = (patientRows as PatientRow[] | null) ?? [];
  const locations = (locationRows as LocationRow[] | null) ?? [];
  const assignments =
    (assignmentRows as PracticeMemberLocationRow[] | null) ?? [];
  const appointments = (appointmentRows as AppointmentRow[] | null) ?? [];
  const userIds = memberships.map((membership) => membership.user_id);
  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email, first_name, last_name")
      .in("id", userIds);

    if (profilesError) {
      throw new Error("Practice provider profiles could not be loaded.");
    }

    profiles = profileRows as ProfileRow[];
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const locationById = new Map(
    locations.map((location) => [
      location.id,
      {
        city: location.city,
        code: location.code,
        id: location.id,
        isActive: location.is_active,
        name: location.name,
        stateRegion: location.state_region,
      } satisfies AppointmentLocationOption,
    ])
  );
  const locationIdsByUserId = new Map<string, string[]>();

  for (const assignment of assignments) {
    const existingLocationIds = locationIdsByUserId.get(assignment.user_id) ?? [];
    existingLocationIds.push(assignment.location_id);
    locationIdsByUserId.set(assignment.user_id, existingLocationIds);
  }

  const activeAccessibleLocationIds = new Set(
    locations.filter((location) => location.is_active).map((location) => location.id)
  );
  const providerByUserId = new Map<string, AppointmentProviderOption>();

  for (const membership of memberships) {
    const provider = {
      displayName: getProfileDisplayName(
        profileById.get(membership.user_id) ?? null
      ),
      employmentTitle: membership.employment_title,
      locationIds: locationIdsByUserId.get(membership.user_id) ?? [],
      role: membership.role,
      specialties: membership.specialties,
      userId: membership.user_id,
    } satisfies AppointmentProviderOption;

    providerByUserId.set(membership.user_id, provider);
  }

  const schedulableProviders = memberships
    .filter(
      (membership) =>
        membership.is_active &&
        (membership.role === "practice_owner" || membership.role === "provider")
    )
    .map((membership) => providerByUserId.get(membership.user_id))
    .filter((provider): provider is AppointmentProviderOption => Boolean(provider))
    .filter(
      (provider) =>
        provider.role === "practice_owner" ||
        activeAccessibleLocationIds.size === 0 ||
        provider.locationIds.some((locationId) =>
          activeAccessibleLocationIds.has(locationId)
        )
    );
  const appointmentPatients: AppointmentPatientOption[] = patients
    .filter((patient) => patient.status === "active")
    .map((patient) => ({
      chartNumber: patient.chart_number,
      displayName: getPatientDisplayName(patient),
      id: patient.id,
    }));
  const agendaEntries: AppointmentAgendaEntry[] = appointments.flatMap(
    (appointment) => {
      const patient = patientById.get(appointment.patient_id);
      const provider = providerByUserId.get(appointment.provider_user_id);

      if (!patient || !provider) {
        return [];
      }

      return [
        {
          appointmentType: appointment.appointment_type,
          checkInAt: appointment.check_in_at,
          completedAt: appointment.completed_at,
          createdAt: appointment.created_at,
          endsAt: appointment.ends_at,
          id: appointment.id,
          location:
            appointment.location_id && locationById.has(appointment.location_id)
              ? locationById.get(appointment.location_id) ?? null
              : null,
          notes: appointment.notes,
          patient: {
            chartNumber: patient.chart_number,
            displayName: getPatientDisplayName(patient),
            id: patient.id,
          },
          provider,
          roomLabel: appointment.room_label,
          startsAt: appointment.starts_at,
          status: appointment.status,
          visitReason: appointment.visit_reason,
        },
      ];
    }
  );
  const stats: AppointmentAgendaStats = {
    checkedInCount: agendaEntries.filter(
      (appointment) =>
        appointment.status === "checked_in" || appointment.status === "in_room"
    ).length,
    completedCount: agendaEntries.filter(
      (appointment) => appointment.status === "completed"
    ).length,
    scheduledCount: agendaEntries.filter(
      (appointment) => appointment.status === "scheduled"
    ).length,
    totalAppointments: agendaEntries.length,
  };
  const activeLocations = locations.filter((location) => location.is_active).length;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Appointments
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">
              Scheduling and lifecycle management
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Coordinate providers, locations, visit types, and operational status
              from one protected workspace for {context.practice.name}. The
              current session role is {formatEnumLabel(context.membership.role)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{agendaEntries.length} appointments</Badge>
            <Badge variant="outline">{activeLocations} active locations</Badge>
            <Badge variant="outline">{schedulableProviders.length} providers</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Intake linkage
            </CardDescription>
            <CardTitle>Patient-backed scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Appointments are created against the live patient directory.</p>
            <p>Only active patients are available for new scheduling.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Provider and location scope
            </CardDescription>
            <CardTitle>Location-aware provider matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Providers are filtered by their assigned locations when possible.</p>
            <p>Conflict checks prevent overlapping provider or room schedules.</p>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-white/5 text-slate-50">
          <CardHeader>
            <CardDescription className="text-slate-400">
              Visit progression
            </CardDescription>
            <CardTitle>Lifecycle status controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Move visits from scheduled through check-in, rooming, and completion.</p>
            <p>Terminal states stay locked to preserve timeline integrity.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
          <CardHeader>
            <CardTitle>Create appointment</CardTitle>
            <CardDescription className="text-slate-400">
              Schedule a visit by patient, provider, location, type, and time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAppointmentForm
              locations={Array.from(locationById.values())}
              patients={appointmentPatients}
              practiceTimezone={context.practice.timezone}
              providers={schedulableProviders}
            />
          </CardContent>
        </Card>
        <AppointmentAgenda
          appointments={agendaEntries}
          practiceTimezone={context.practice.timezone}
          stats={stats}
        />
      </div>
    </section>
  );
}
