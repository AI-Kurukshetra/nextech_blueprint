"use client";

import { useState } from "react";
import { Search, ShieldCheck, Wallet } from "lucide-react";
import type {
  PatientDirectoryEntry,
  PatientDirectoryStats,
} from "@/components/patients/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatEnumLabel } from "@/lib/validations";

type PatientDirectoryProps = {
  patients: PatientDirectoryEntry[];
  stats: PatientDirectoryStats;
};

function formatPatientDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPatientDisplayName(patient: PatientDirectoryEntry) {
  if (patient.preferredName) {
    return `${patient.firstName} ${patient.lastName} (${patient.preferredName})`;
  }

  return `${patient.firstName} ${patient.lastName}`;
}

function getPatientLocation(patient: PatientDirectoryEntry) {
  return [patient.city, patient.stateRegion].filter(Boolean).join(", ") || "No location captured";
}

function getPatientSummary(patient: PatientDirectoryEntry) {
  return [
    `DOB ${formatPatientDate(patient.dateOfBirth)}`,
    formatEnumLabel(patient.sexAtBirth),
    getPatientLocation(patient),
  ].join(" | ");
}

function getPatientContactSummary(patient: PatientDirectoryEntry) {
  return [patient.email ?? "No email on file", patient.phone ?? "No phone on file"].join(
    " | "
  );
}

function getPrimaryInsuranceSummary(patient: PatientDirectoryEntry) {
  if (!patient.primaryInsurance) {
    return null;
  }

  return [
    patient.primaryInsurance.payerName,
    patient.primaryInsurance.planName,
    patient.primaryInsurance.memberId,
  ]
    .filter(Boolean)
    .join(" | ");
}

function matchesPatientSearch(patient: PatientDirectoryEntry, searchTerm: string) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return true;
  }

  return [
    patient.chartNumber,
    patient.email ?? "",
    patient.firstName,
    patient.lastName,
    patient.phone ?? "",
    patient.preferredName ?? "",
  ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

export function PatientDirectory({ patients, stats }: PatientDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredPatients = patients.filter((patient) =>
    matchesPatientSearch(patient, searchTerm)
  );

  return (
    <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Patient directory</CardTitle>
            <CardDescription className="text-slate-400">
              Search the practice roster by patient name, chart number, email, or phone.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.totalPatients} total</Badge>
            <Badge variant="outline">{stats.portalEnabledCount} portal linked</Badge>
            <Badge variant="outline">{stats.insuredPatientCount} insured</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
          <Input
            className="border-white/10 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by patient, chart number, email, or phone"
            value={searchTerm}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-400">
          <span>{filteredPatients.length} shown</span>
          {searchTerm ? <span>{`for "${searchTerm}"`}</span> : null}
        </div>
        {filteredPatients.length > 0 ? (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <article
                className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                key={patient.id}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {getPatientDisplayName(patient)}
                      </h3>
                      <Badge variant="secondary">{patient.chartNumber}</Badge>
                      <Badge variant={patient.status === "active" ? "outline" : "secondary"}>
                        {formatEnumLabel(patient.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">
                      {getPatientSummary(patient)}
                    </p>
                    <p className="text-sm text-slate-400">
                      {getPatientContactSummary(patient)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={patient.portalEnabled ? "secondary" : "outline"}>
                      <ShieldCheck className="mr-1 size-3.5" />
                      {patient.portalEnabled ? "Portal linked" : "Portal not linked"}
                    </Badge>
                    <Badge variant={patient.primaryInsurance ? "secondary" : "outline"}>
                      <Wallet className="mr-1 size-3.5" />
                      {patient.primaryInsurance ? "Insurance on file" : "Self-pay / pending"}
                    </Badge>
                  </div>
                </div>
                {patient.primaryInsurance ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
                    {getPrimaryInsuranceSummary(patient)}
                  </div>
                ) : null}
                {(patient.allergies.length > 0 || patient.dermatologyFlags.length > 0) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {patient.allergies.map((allergy) => (
                      <Badge key={`${patient.id}-allergy-${allergy}`} variant="outline">
                        Allergy: {allergy}
                      </Badge>
                    ))}
                    {patient.dermatologyFlags.map((flag) => (
                      <Badge key={`${patient.id}-flag-${flag}`} variant="secondary">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-400">
            No patients matched the current search. Adjust the query or create a
            new intake record.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
