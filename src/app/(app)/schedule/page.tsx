import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import {
  listAppointments,
  listUnscheduledJobs,
  dayBounds,
} from "@/server/modules/schedule/schedule.service";
import { listTechnicians } from "@/server/modules/workorder/workorder.service";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { t, jobStatusTh } from "@/i18n";
import { DispatchBoard, type ApptVM } from "./dispatch-board";
import { ScheduleJobForm } from "./schedule-form";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}
function timeLabel(d: Date): string {
  return d.toISOString().slice(11, 16);
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const ctx = await requirePermission("schedule", "read");
  const { date: dateParam } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? (dateParam as string)
    : isoDate(new Date());

  const { from, to } = dayBounds(date);
  const mineOnly = ctx.role === "TECHNICIAN";
  const canEdit = can(ctx.role, "schedule", "update");
  const canCreate = can(ctx.role, "schedule", "create");

  const [appointments, technicians, unscheduled] = await Promise.all([
    listAppointments(ctx, from, to, { mineOnly }),
    listTechnicians(ctx),
    canCreate ? listUnscheduledJobs(ctx) : Promise.resolve([]),
  ]);

  const apptVMs: ApptVM[] = appointments.map((a) => ({
    id: a.id,
    technicianId: a.technicianId,
    startLabel: timeLabel(a.startAt),
    endLabel: timeLabel(a.endAt),
    jobId: a.workOrder.id,
    jobNumber: a.workOrder.number,
    summary: a.workOrder.summary,
    customerName: a.workOrder.customer.name,
    statusTh: jobStatusTh[a.workOrder.status],
  }));

  const techVMs = technicians.map((tech) => ({
    id: tech.id,
    name: tech.user.name,
    color: tech.color,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t.dispatchBoard} subtitle={date} />

      <div className="flex items-center gap-2 text-sm">
        <Link
          href={`/schedule?date=${shift(date, -1)}`}
          className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {t.prevDay}
        </Link>
        <Link
          href={`/schedule?date=${isoDate(new Date())}`}
          className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {t.today}
        </Link>
        <Link
          href={`/schedule?date=${shift(date, 1)}`}
          className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {t.nextDay}
        </Link>
      </div>

      <DispatchBoard
        technicians={techVMs}
        appointments={apptVMs}
        canEdit={canEdit}
      />

      {canCreate && (
        <Card title={t.unscheduled}>
          {unscheduled.length === 0 ? (
            <EmptyState>{t.noUnscheduled}</EmptyState>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {unscheduled.map((job) => (
                <ScheduleJobForm
                  key={job.id}
                  date={date}
                  technicians={techVMs.map((tv) => ({
                    id: tv.id,
                    name: tv.name,
                  }))}
                  job={{
                    id: job.id,
                    number: job.number,
                    summary: job.summary,
                    customerName: job.customer.name,
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
