"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Search } from "lucide-react";
import {
  updateClinicalNoteStatusAction,
  updateClinicalNoteVisibilityAction,
  type ClinicalNoteActionState,
} from "@/app/actions/clinical-notes";
import type {
  ClinicalNoteEntry,
  ClinicalNoteStats,
} from "@/components/clinical-notes/types";
import { FormStatus } from "@/components/auth/form-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clinicalNoteStatusOptions,
  formatEnumLabel,
  isClinicalNoteStatusTransitionAllowed,
  type ClinicalNoteStatus,
} from "@/lib/validations";

type ClinicalNotesBoardProps = {
  notes: ClinicalNoteEntry[];
  stats: ClinicalNoteStats;
};

const initialClinicalNoteActionState: ClinicalNoteActionState = { status: "idle" };

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesNoteSearch(note: ClinicalNoteEntry, normalizedSearchTerm: string) {
  if (!normalizedSearchTerm) {
    return true;
  }

  return [
    note.author.displayName,
    note.diagnosisCodes.join(" "),
    note.patient.chartNumber,
    note.patient.displayName,
  ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

function getStatusTransitions(currentStatus: ClinicalNoteStatus) {
  return clinicalNoteStatusOptions.filter((status) =>
    isClinicalNoteStatusTransitionAllowed(currentStatus, status)
  );
}

export function ClinicalNotesBoard({ notes, stats }: ClinicalNotesBoardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusState, submitStatusAction, isStatusPending] = useActionState(
    updateClinicalNoteStatusAction,
    initialClinicalNoteActionState
  );
  const [visibilityState, submitVisibilityAction, isVisibilityPending] = useActionState(
    updateClinicalNoteVisibilityAction,
    initialClinicalNoteActionState
  );
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => matchesNoteSearch(note, normalizedSearchTerm));

  useEffect(() => {
    if (statusState.status !== "success" && visibilityState.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, statusState.status, visibilityState.status]);

  return (
    <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Clinical notes board</CardTitle>
            <CardDescription className="text-slate-400">
              Review draft and signed notes, then control status transitions and
              patient-portal visibility.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.totalNotes} total</Badge>
            <Badge variant="outline">{stats.draftCount} drafts</Badge>
            <Badge variant="outline">{stats.signedOrAddendumCount} signed/addendum</Badge>
            <Badge variant="outline">{stats.patientVisibleCount} patient-visible</Badge>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
          <Input
            className="border-white/10 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by patient, chart number, author, or diagnosis code"
            value={searchTerm}
          />
        </div>
        <FormStatus
          className="bg-transparent"
          message={statusState.message ?? visibilityState.message}
          tone={
            (statusState.status === "success" || visibilityState.status === "success")
              ? "success"
              : "error"
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredNotes.length > 0 ? (
          <div className="space-y-4">
            {filteredNotes.map((note) => {
              const transitions = getStatusTransitions(note.status);

              return (
                <article
                  className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                  key={note.id}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          {note.patient.displayName} - {note.patient.chartNumber}
                        </h3>
                        <Badge variant="secondary">{formatEnumLabel(note.noteType)}</Badge>
                        <Badge variant={note.status === "draft" ? "outline" : "secondary"}>
                          {formatEnumLabel(note.status)}
                        </Badge>
                        <Badge variant={note.isPatientVisible ? "secondary" : "outline"}>
                          {note.isPatientVisible ? "Portal visible" : "Portal hidden"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-300">
                        <p>Author: {note.author.displayName}</p>
                        <p>Created: {formatDateTime(note.createdAt)}</p>
                        {note.signedAt ? <p>Signed: {formatDateTime(note.signedAt)}</p> : null}
                        {note.appointment ? (
                          <p>
                            Appointment: {note.appointment.label} (
                            {formatEnumLabel(note.appointment.status)})
                          </p>
                        ) : null}
                      </div>
                      {note.diagnosisCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {note.diagnosisCodes.map((code) => (
                            <Badge key={`${note.id}-${code}`} variant="outline">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                        {note.subjective ? (
                          <p>
                            <span className="font-medium text-white">Subjective:</span>{" "}
                            {note.subjective}
                          </p>
                        ) : null}
                        {note.objective ? (
                          <p>
                            <span className="font-medium text-white">Objective:</span>{" "}
                            {note.objective}
                          </p>
                        ) : null}
                        {note.assessment ? (
                          <p>
                            <span className="font-medium text-white">Assessment:</span>{" "}
                            {note.assessment}
                          </p>
                        ) : null}
                        {note.plan ? (
                          <p>
                            <span className="font-medium text-white">Plan:</span> {note.plan}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="w-full max-w-md space-y-3 rounded-[1.6rem] border border-white/10 bg-slate-950/40 p-4">
                      {transitions.length > 0 ? (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            const nextStatus = formData.get("next_status");

                            if (typeof nextStatus !== "string") {
                              return;
                            }

                            startTransition(() => {
                              submitStatusAction({
                                nextStatus: nextStatus as ClinicalNoteStatus,
                                noteId: note.id,
                              });
                            });
                          }}
                        >
                          <label className="text-sm font-medium text-white">Status transition</label>
                          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                            <select
                              className="flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                              defaultValue={transitions[0]}
                              name="next_status"
                            >
                              {transitions.map((status) => (
                                <option
                                  className="bg-slate-950 text-white"
                                  key={status}
                                  value={status}
                                >
                                  {formatEnumLabel(status)}
                                </option>
                              ))}
                            </select>
                            <Button disabled={isStatusPending} type="submit" variant="outline">
                              {isStatusPending ? "Updating..." : "Apply"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-sm text-slate-400">
                          This note is in a terminal charting state.
                        </p>
                      )}
                      <Button
                        className="w-full"
                        disabled={isVisibilityPending}
                        onClick={() =>
                          startTransition(() => {
                            submitVisibilityAction({
                              isPatientVisible: !note.isPatientVisible,
                              noteId: note.id,
                            });
                          })
                        }
                        type="button"
                        variant="outline"
                      >
                        {note.isPatientVisible ? (
                          <>
                            <EyeOff className="mr-1 size-4" />
                            Hide from patient portal
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 size-4" />
                            Make patient-visible
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-400">
            No notes matched the current search. Adjust the query or create a new note.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
