"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateAppointmentStatusAction,
  type AppointmentActionState,
} from "@/app/actions/appointments";
import { FormStatus } from "@/components/auth/form-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEnumLabel, type AppointmentStatus } from "@/lib/validations";

type AppointmentStatusFormProps = {
  appointmentId: string;
  availableStatuses: AppointmentStatus[];
  currentStatus: AppointmentStatus;
};

const initialAppointmentActionState: AppointmentActionState = { status: "idle" };

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

export function AppointmentStatusForm({
  appointmentId,
  availableStatuses,
  currentStatus,
}: AppointmentStatusFormProps) {
  const [actionState, submitAction, isPending] = useActionState(
    updateAppointmentStatusAction,
    initialAppointmentActionState
  );
  const [nextStatus, setNextStatus] = useState<AppointmentStatus | "">(
    availableStatuses[0] ?? ""
  );
  const router = useRouter();

  useEffect(() => {
    setNextStatus(availableStatuses[0] ?? "");
  }, [availableStatuses, currentStatus]);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    router.refresh();
  }, [actionState.status, router]);

  if (availableStatuses.length === 0) {
    return (
      <div className="space-y-2">
        <Badge variant="outline">Terminal status</Badge>
        <p className="text-sm text-slate-400">
          This appointment is already {formatEnumLabel(currentStatus)}.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();

        if (!nextStatus) {
          return;
        }

        startTransition(() => {
          submitAction({
            appointmentId,
            nextStatus,
          });
        });
      }}
    >
      <FormStatus
        className="bg-transparent"
        message={actionState.message}
        tone={actionState.status === "success" ? "success" : "error"}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          className={selectClassName}
          disabled={isPending}
          onChange={(event) => setNextStatus(event.target.value as AppointmentStatus)}
          value={nextStatus}
        >
          {availableStatuses.map((status) => (
            <option className="bg-slate-950 text-white" key={status} value={status}>
              {formatEnumLabel(status)}
            </option>
          ))}
        </select>
        <Button disabled={isPending || !nextStatus} type="submit" variant="outline">
          {isPending ? "Updating..." : "Update status"}
        </Button>
      </div>
    </form>
  );
}
