import type {
  JobStatus,
  JobPriority,
  InvoiceStatus,
  EstimateStatus,
} from "@/generated/prisma/client";
import {
  jobStatusTh,
  jobPriorityTh,
  invoiceStatusTh,
  estimateStatusTh,
} from "@/i18n";

const STATUS_COLORS: Record<JobStatus, string> = {
  DRAFT: "bg-gray-500/15 text-gray-600 dark:text-gray-300",
  SCHEDULED: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  DISPATCHED: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  EN_ROUTE: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
  IN_PROGRESS: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  ON_HOLD: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  COMPLETED: "bg-green-500/15 text-green-600 dark:text-green-300",
  INVOICED: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  CLOSED: "bg-gray-500/15 text-gray-500",
  CANCELLED: "bg-red-500/15 text-red-600 dark:text-red-300",
};

const PRIORITY_COLORS: Record<JobPriority, string> = {
  LOW: "text-foreground/50",
  NORMAL: "text-foreground/70",
  HIGH: "text-orange-600 dark:text-orange-400",
  URGENT: "text-red-600 dark:text-red-400 font-semibold",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {jobStatusTh[status]}
    </span>
  );
}

const INVOICE_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-500/15 text-gray-600 dark:text-gray-300",
  SENT: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  PARTIAL: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  PAID: "bg-green-500/15 text-green-600 dark:text-green-300",
  OVERDUE: "bg-red-500/15 text-red-600 dark:text-red-300",
  VOID: "bg-gray-500/15 text-gray-500 line-through",
};

export function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_COLORS[status]}`}
    >
      {invoiceStatusTh[status]}
    </span>
  );
}

const ESTIMATE_COLORS: Record<EstimateStatus, string> = {
  DRAFT: "bg-gray-500/15 text-gray-600 dark:text-gray-300",
  SENT: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  APPROVED: "bg-green-500/15 text-green-600 dark:text-green-300",
  REJECTED: "bg-red-500/15 text-red-600 dark:text-red-300",
  EXPIRED: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  CONVERTED: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
};

export function EstimateBadge({ status }: { status: EstimateStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTIMATE_COLORS[status]}`}
    >
      {estimateStatusTh[status]}
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: JobPriority }) {
  return (
    <span className={`text-xs ${PRIORITY_COLORS[priority]}`}>
      {jobPriorityTh[priority]}
    </span>
  );
}
