"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  initialBillingActionState,
  updateBillingRecordStatusAction,
} from "@/app/actions/billing";
import type {
  BillingRecordEntry,
  BillingRecordStats,
} from "@/components/billing/types";
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
  billingStatusOptions,
  formatEnumLabel,
  isBillingStatusTransitionAllowed,
  type BillingStatus,
} from "@/lib/validations";

type BillingBoardProps = {
  records: BillingRecordEntry[];
  stats: BillingRecordStats;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesBillingSearch(record: BillingRecordEntry, normalizedSearchTerm: string) {
  if (!normalizedSearchTerm) {
    return true;
  }

  return [
    record.patient.displayName,
    record.patient.chartNumber,
    record.cptCode,
    record.claimReference ?? "",
    record.status,
    record.icd10Codes.join(" "),
  ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

function getStatusTransitions(currentStatus: BillingStatus) {
  return billingStatusOptions.filter((status) =>
    isBillingStatusTransitionAllowed(currentStatus, status)
  );
}

export function BillingBoard({ records, stats }: BillingBoardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionState, submitAction, isPending] = useActionState(
    updateBillingRecordStatusAction,
    initialBillingActionState
  );
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRecords = records.filter((record) =>
    matchesBillingSearch(record, normalizedSearchTerm)
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
            <CardTitle>Billing records board</CardTitle>
            <CardDescription className="text-slate-400">
              Track statuses, balances, and payment progression for CPT-coded charges.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stats.totalRecords} records</Badge>
            <Badge variant="outline">{stats.readyOrSubmittedCount} ready/submitted</Badge>
            <Badge variant="outline">{stats.paidCount} paid</Badge>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Badge variant="secondary">Charges {formatCurrency(stats.totalCharges)}</Badge>
          <Badge variant="secondary">
            Outstanding {formatCurrency(stats.outstandingBalanceTotal)}
          </Badge>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
          <Input
            className="border-white/10 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by patient, CPT code, claim reference, or status"
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
        {filteredRecords.length > 0 ? (
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const transitions = getStatusTransitions(record.status);

              return (
                <article
                  className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                  key={record.id}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          {record.patient.displayName} - {record.patient.chartNumber}
                        </h3>
                        <Badge variant="secondary">{record.cptCode}</Badge>
                        <Badge variant={record.status === "paid" ? "secondary" : "outline"}>
                          {formatEnumLabel(record.status)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-300">
                        <p>Service date: {record.serviceDate}</p>
                        <p>Charge: {formatCurrency(record.chargeAmount)}</p>
                        <p>Balance: {formatCurrency(record.balanceAmount)}</p>
                        <p>Units: {record.units}</p>
                        {record.allowedAmount !== null ? (
                          <p>Allowed: {formatCurrency(record.allowedAmount)}</p>
                        ) : null}
                        {record.claimReference ? <p>Claim: {record.claimReference}</p> : null}
                        {record.provider ? <p>Provider: {record.provider.displayName}</p> : null}
                        {record.insurance ? (
                          <p>
                            Insurance: {record.insurance.payerName} - {record.insurance.memberId}
                          </p>
                        ) : (
                          <p>Insurance: Self-pay</p>
                        )}
                        {record.submittedAt ? <p>Submitted: {formatDateTime(record.submittedAt)}</p> : null}
                        {record.paidAt ? <p>Paid: {formatDateTime(record.paidAt)}</p> : null}
                      </div>
                      {record.modifierCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {record.modifierCodes.map((code) => (
                            <Badge key={`${record.id}-modifier-${code}`} variant="outline">
                              Modifier {code}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {record.icd10Codes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {record.icd10Codes.map((code) => (
                            <Badge key={`${record.id}-icd-${code}`} variant="outline">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {record.notes ? <p className="text-sm text-slate-400">{record.notes}</p> : null}
                    </div>
                    <div className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-slate-950/40 p-4">
                      {transitions.length > 0 ? (
                        <form
                          className="space-y-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            const nextStatus = formData.get("next_status");
                            const balanceRaw = formData.get("balance_amount");

                            if (typeof nextStatus !== "string") {
                              return;
                            }

                            const parsedBalance =
                              typeof balanceRaw === "string" && balanceRaw.length > 0
                                ? Number(balanceRaw)
                                : undefined;

                            startTransition(() => {
                              submitAction({
                                balanceAmount:
                                  typeof parsedBalance === "number" &&
                                  !Number.isNaN(parsedBalance)
                                    ? parsedBalance
                                    : undefined,
                                nextStatus: nextStatus as BillingStatus,
                                recordId: record.id,
                              });
                            });
                          }}
                        >
                          <label className="text-sm font-medium text-white">
                            Update billing status
                          </label>
                          <select
                            className="flex h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                            defaultValue={transitions[0]}
                            name="next_status"
                          >
                            {transitions.map((status) => (
                              <option className="bg-slate-950 text-white" key={status} value={status}>
                                {formatEnumLabel(status)}
                              </option>
                            ))}
                          </select>
                          <Input
                            defaultValue={record.balanceAmount}
                            min={0}
                            name="balance_amount"
                            placeholder="Remaining balance for partial payment"
                            step="0.01"
                            type="number"
                          />
                          <Button className="w-full" disabled={isPending} type="submit" variant="outline">
                            {isPending ? "Updating..." : "Apply update"}
                          </Button>
                        </form>
                      ) : (
                        <p className="text-sm text-slate-400">
                          This record is in a terminal billing state.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-400">
            No billing records matched the current search.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
