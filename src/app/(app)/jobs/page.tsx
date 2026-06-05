import Link from "next/link";
import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { listWorkOrders } from "@/server/modules/workorder/workorder.service";
import type { JobStatus } from "@/generated/prisma/client";
import { PageHeader, ButtonLink, Card, EmptyState } from "@/components/ui/primitives";
import { StatusBadge, PriorityLabel } from "@/components/ui/status-badge";
import { t, jobStatusTh } from "@/i18n";

const STATUSES: JobStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "DISPATCHED",
  "EN_ROUTE",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "INVOICED",
  "CLOSED",
  "CANCELLED",
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requirePermission("job", "read");
  const { status } = await searchParams;
  const active = STATUSES.includes(status as JobStatus)
    ? (status as JobStatus)
    : undefined;

  // Technicians see only their own jobs.
  const mineOnly = ctx.role === "TECHNICIAN";
  const jobs = await listWorkOrders(ctx, { status: active, mineOnly });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.jobs}
        subtitle={mineOnly ? t.myJobs : `${jobs.length} ${t.shown}`}
        action={
          can(ctx.role, "job", "create") ? (
            <ButtonLink href="/jobs/new">{t.newJob}</ButtonLink>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-1 text-sm">
        <Link
          href="/jobs"
          className={`rounded-md px-2 py-1 ${!active ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
        >
          {t.all}
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/jobs?status=${s}`}
            className={`rounded-md px-2 py-1 ${active === s ? "bg-foreground text-background" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
          >
            {jobStatusTh[s]}
          </Link>
        ))}
      </div>

      <Card>
        {jobs.length === 0 ? (
          <EmptyState>{t.noJobs}</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">{t.summary}</th>
                <th className="px-2 py-2 font-medium">{t.customer}</th>
                <th className="px-2 py-2 font-medium">{t.technician}</th>
                <th className="px-2 py-2 font-medium">{t.priority}</th>
                <th className="px-2 py-2 font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-2 py-2 text-foreground/60">{j.number}</td>
                  <td className="px-2 py-2">
                    <Link
                      href={`/jobs/${j.id}`}
                      className="font-medium hover:underline"
                    >
                      {j.summary}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-foreground/70">
                    {j.customer.name}
                  </td>
                  <td className="px-2 py-2 text-foreground/70">
                    {j.assignedTech?.user.name ?? "—"}
                  </td>
                  <td className="px-2 py-2">
                    <PriorityLabel priority={j.priority} />
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge status={j.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
