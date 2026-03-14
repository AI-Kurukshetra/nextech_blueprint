"use client";

import { useState } from "react";
import { CalendarDays, Clock3, MapPin, Search, Stethoscope } from "lucide-react";
import { AppointmentStatusForm } from "@/components/appointments/appointment-status-form";
import type {
  AppointmentAgendaEntry,
  AppointmentAgendaStats,
} from "@/components/appointments/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  appointmentStatusOptions,
  formatEnumLabel,
  isAppointmentStatusTransitionAllowed,
  type AppointmentStatus,
} from "@/lib/validations";

type AppointmentAgendaProps = {
  appointments: AppointmentAgendaEntry[];
  practiceTimezone: string;
  stats: AppointmentAgendaStats;
};

function getDateKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const partMap = new Map(parts.map((part) => [part.type, part.value]));

  return `${partMap.get("year")}-${partMap.get("month")}-${partMap.get("day")}`;
}

function formatAgendaDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone,
  }).format(new Date(value));
}

function formatAppointmentWindow(
  startsAt: string,
  endsAt: string,
  timeZone: string
) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(
    new Date(endsAt)
  )}`;
}

function formatAppointmentTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function getLocationSummary(appointment: AppointmentAgendaEntry) {
  if (!appointment.location) {
    return "No location";
  }

  const locationSummary = [appointment.location.city, appointment.location.stateRegion]
    .filter(Boolean)
    .join(", ");

  return locationSummary
    ? `${appointment.location.name} (${appointment.location.code}) - ${locationSummary}`
    : `${appointment.location.name} (${appointment.location.code})`;
}

function getPatientSummary(appointment: AppointmentAgendaEntry) {
  return `${appointment.patient.displayName} - ${appointment.patient.chartNumber}`;
}

function matchesSearch(
  appointment: AppointmentAgendaEntry,
  normalizedSearchTerm: string
) {
  if (!normalizedSearchTerm) {
    return true;
  }

  return [
    appointment.location?.code ?? "",
    appointment.location?.name ?? "",
    appointment.patient.chartNumber,
    appointment.patient.displayName,
    appointment.provider.displayName,
    appointment.visitReason ?? "",
  ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

function getAvailableStatusTransitions(currentStatus: AppointmentStatus) {
  return appointmentStatusOptions.filter((status) =>
    isAppointmentStatusTransitionAllowed(currentStatus, status)
  );
}

export function AppointmentAgenda({
  appointments,
  practiceTimezone,
  stats,
}: AppointmentAgendaProps) {
  const todayKey = getDateKey(new Date().toISOString(), practiceTimezone);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredAppointments = appointments.filter(
    (appointment) =>
      getDateKey(appointment.startsAt, practiceTimezone) === selectedDate &&
      matchesSearch(appointment, normalizedSearchTerm)
  );
  const selectedDateLabel =
    filteredAppointments[0]?.startsAt ??
    appointments.find(
      (appointment) => getDateKey(appointment.startsAt, practiceTimezone) === selectedDate
    )?.startsAt ??
    new Date().toISOString();

  return (
    <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Appointment agenda</CardTitle>
            <CardDescription className="text-slate-400">
              Review the current schedule, search active visits, and move patients
              through the appointment lifecycle.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.totalAppointments} total</Badge>
            <Badge variant="outline">{stats.scheduledCount} scheduled</Badge>
            <Badge variant="outline">{stats.checkedInCount} checked in / roomed</Badge>
            <Badge variant="outline">{stats.completedCount} completed</Badge>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
            <Input
              className="border-white/10 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search patient, provider, location, or reason"
              value={searchTerm}
            />
          </div>
          <Input
            className="border-white/10 bg-slate-950/70 text-white"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <CalendarDays className="size-4 text-sky-300" />
            <span>{formatAgendaDate(selectedDateLabel, practiceTimezone)}</span>
            <Badge variant="secondary">{filteredAppointments.length} appointments shown</Badge>
          </div>
        </div>
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <article
                className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                key={appointment.id}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {getPatientSummary(appointment)}
                      </h3>
                      <Badge variant="secondary">
                        {formatEnumLabel(appointment.appointmentType)}
                      </Badge>
                      <Badge
                        variant={
                          appointment.status === "completed" ? "secondary" : "outline"
                        }
                      >
                        {formatEnumLabel(appointment.status)}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-300">
                      <p className="flex items-center gap-2">
                        <Clock3 className="size-4 text-sky-300" />
                        {formatAppointmentWindow(
                          appointment.startsAt,
                          appointment.endsAt,
                          practiceTimezone
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-sky-300" />
                        {appointment.provider.displayName} -{" "}
                        {formatEnumLabel(appointment.provider.role)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="size-4 text-sky-300" />
                        {getLocationSummary(appointment)}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-400">
                      {appointment.visitReason ? (
                        <p>
                          <span className="font-medium text-white">Reason:</span>{" "}
                          {appointment.visitReason}
                        </p>
                      ) : null}
                      {appointment.roomLabel ? (
                        <p>
                          <span className="font-medium text-white">Room:</span>{" "}
                          {appointment.roomLabel}
                        </p>
                      ) : null}
                      {appointment.notes ? (
                        <p>
                          <span className="font-medium text-white">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      ) : null}
                      {appointment.checkInAt ? (
                        <p>
                          <span className="font-medium text-white">Checked in:</span>{" "}
                          {formatAppointmentTime(
                            appointment.checkInAt,
                            practiceTimezone
                          )}
                        </p>
                      ) : null}
                      {appointment.completedAt ? (
                        <p>
                          <span className="font-medium text-white">Completed:</span>{" "}
                          {formatAppointmentTime(
                            appointment.completedAt,
                            practiceTimezone
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-slate-950/40 p-4">
                    <AppointmentStatusForm
                      appointmentId={appointment.id}
                      availableStatuses={getAvailableStatusTransitions(appointment.status)}
                      currentStatus={appointment.status}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-400">
            No appointments matched this day and search combination. Change the date
            or create a new appointment from the scheduler form.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
