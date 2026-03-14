"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Search } from "lucide-react";
import {
  initialDocumentActionState,
  updatePatientDocumentVisibilityAction,
} from "@/app/actions/documents";
import type {
  PatientDocumentEntry,
  PatientDocumentStats,
} from "@/components/documents/types";
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
import { formatEnumLabel } from "@/lib/validations";

type DocumentsBoardProps = {
  documents: PatientDocumentEntry[];
  stats: PatientDocumentStats;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesDocumentSearch(
  document: PatientDocumentEntry,
  normalizedSearchTerm: string
) {
  if (!normalizedSearchTerm) {
    return true;
  }

  return [
    document.fileName,
    document.patient.chartNumber,
    document.patient.displayName,
    document.storagePath,
    document.documentType,
  ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

export function DocumentsBoard({ documents, stats }: DocumentsBoardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionState, submitAction, isPending] = useActionState(
    updatePatientDocumentVisibilityAction,
    initialDocumentActionState
  );
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) =>
    matchesDocumentSearch(document, normalizedSearchTerm)
  );

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    router.refresh();
  }, [actionState.status, router]);

  return (
    <Card className="border border-white/10 bg-slate-900/70 text-slate-50">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Patient documents board</CardTitle>
            <CardDescription className="text-slate-400">
              Search document metadata, review storage references, and toggle
              patient visibility.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.totalDocuments} total</Badge>
            <Badge variant="outline">{stats.photoCount} clinical photos</Badge>
            <Badge variant="outline">{stats.patientVisibleCount} patient-visible</Badge>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
          <Input
            className="border-white/10 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patient, file name, type, or storage path"
            value={searchTerm}
          />
        </div>
        <FormStatus
          className="bg-transparent"
          message={actionState.message}
          tone={actionState.status === "success" ? "success" : "error"}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredDocuments.length > 0 ? (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <article
                className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                key={document.id}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{document.fileName}</h3>
                      <Badge variant="secondary">
                        {formatEnumLabel(document.documentType)}
                      </Badge>
                      <Badge variant={document.isPatientVisible ? "secondary" : "outline"}>
                        {document.isPatientVisible ? "Portal visible" : "Portal hidden"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-slate-300">
                      <p>
                        Patient: {document.patient.displayName} - {document.patient.chartNumber}
                      </p>
                      <p>MIME type: {document.mimeType}</p>
                      <p>
                        Uploaded: {formatDateTime(document.createdAt)}
                        {document.author ? ` by ${document.author.displayName}` : ""}
                      </p>
                      {document.capturedAt ? (
                        <p>Captured: {formatDateTime(document.capturedAt)}</p>
                      ) : null}
                      {document.appointment ? (
                        <p>
                          Appointment: {document.appointment.label} (
                          {formatEnumLabel(document.appointment.status)})
                        </p>
                      ) : null}
                      <p>
                        Storage: {document.storageBucket}/{document.storagePath}
                      </p>
                    </div>
                    {document.description ? (
                      <p className="text-sm text-slate-400">{document.description}</p>
                    ) : null}
                  </div>
                  <Button
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => {
                        submitAction({
                          documentId: document.id,
                          isPatientVisible: !document.isPatientVisible,
                        });
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    {document.isPatientVisible ? (
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
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-400">
            No documents matched the current search. Adjust the query or save new
            document metadata.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
